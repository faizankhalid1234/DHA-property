import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import { validateCNIC, formatCNIC } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/validate.js';

export const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { cnic: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .populate('properties')
      .populate('user', 'email isActive lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: customers,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate({
      path: 'properties',
      populate: { path: 'block', select: 'name sector' },
    })
    .populate('user', 'email isActive lastLogin');
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  res.json({ success: true, data: customer });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { fullName, fatherName, cnic, phone, email, address, password, profileImage } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phone?.trim();

  if (!fullName?.trim() || !normalizedEmail || !normalizedPhone || !address?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Full name, email, phone, and address are required',
    });
  }

  let formattedCnic;
  if (cnic?.trim()) {
    if (!validateCNIC(cnic)) {
      return res.status(400).json({ success: false, message: 'Invalid CNIC format' });
    }
    formattedCnic = formatCNIC(cnic);
    const byCnic = await Customer.findOne({ cnic: formattedCnic });
    if (byCnic) {
      return res.status(400).json({ success: false, message: 'A customer with this CNIC already exists' });
    }
  }

  const existingCustomer = await Customer.findOne({ email: normalizedEmail });
  if (existingCustomer) {
    return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'This email is already registered. Use a different email address.',
    });
  }

  const customer = await Customer.create({
    fullName: fullName.trim(),
    ...(fatherName?.trim() && { fatherName: fatherName.trim() }),
    ...(formattedCnic && { cnic: formattedCnic }),
    phone: normalizedPhone,
    email: normalizedEmail,
    address: address.trim(),
    profileImage,
    createdBy: req.user._id,
  });

  if (password?.trim()) {
    const user = await User.create({
      name: fullName.trim(),
      email: normalizedEmail,
      password: password.trim(),
      phone: normalizedPhone,
      role: 'customer',
      customerRef: customer._id,
    });
    customer.user = user._id;
    await customer.save();
  }

  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const ownedProperties = await Property.countDocuments({ currentOwner: customer._id });
  if (ownedProperties > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete customer with assigned properties',
    });
  }

  if (customer.user) {
    await User.findByIdAndDelete(customer.user);
  }
  await customer.deleteOne();
  res.json({ success: true, message: 'Customer deleted' });
});

export const verifyCustomerOwnership = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  customer.isVerified = true;
  await customer.save();
  res.json({ success: true, data: customer });
});

export const getCustomerCount = asyncHandler(async (req, res) => {
  const total = await Customer.countDocuments();
  const verified = await Customer.countDocuments({ isVerified: true });
  const recent = await Customer.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  res.json({ success: true, data: { total, verified, recent } });
});
