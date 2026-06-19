import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { generateToken } from '../utils/generateToken.js';
import { validateCNIC, formatCNIC } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/validate.js';

export const login = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated' });
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      customerRef: user.customerRef,
      token: generateToken(user._id, user.role),
    },
  });
});

export const customerRegister = asyncHandler(async (req, res) => {
  const fullName = req.body.fullName?.trim();
  const fatherName = req.body.fatherName?.trim();
  const cnic = req.body.cnic?.trim();
  const phone = req.body.phone?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const address = req.body.address?.trim();
  const { password } = req.body;

  if (!fullName || !phone || !email || !address || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email, phone, address and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
  }

  const preRegistered = await Customer.findOne({ email });

  if (preRegistered) {
    if (preRegistered.user) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const storedPhone = preRegistered.phone.replace(/\D/g, '');
    if (normalizedPhone !== storedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number does not match the email on file. Use the phone number admin registered for you.',
      });
    }

    const user = await User.create({
      name: fullName,
      email,
      password,
      phone,
      role: 'customer',
      customerRef: preRegistered._id,
    });

    preRegistered.fullName = fullName;
    preRegistered.address = address;
    if (fatherName) preRegistered.fatherName = fatherName;
    if (cnic?.trim()) {
      if (!validateCNIC(cnic)) {
        return res.status(400).json({ success: false, message: 'Invalid CNIC. Use 13 digits e.g. 42101-1234567-1' });
      }
      preRegistered.cnic = formatCNIC(cnic);
    }
    preRegistered.user = user._id;
    await preRegistered.save();

    return res.status(201).json({
      success: true,
      message: 'Account activated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          customerRef: preRegistered._id,
          token: generateToken(user._id, user.role),
        },
        customer: preRegistered,
      },
    });
  }

  if (!fatherName || !cnic) {
    return res.status(400).json({ success: false, message: 'All fields are required for new registration' });
  }

  if (!validateCNIC(cnic)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid CNIC. Use 13 digits e.g. 42101-1234567-1',
    });
  }

  const formattedCnic = formatCNIC(cnic);

  const existingCustomer = await Customer.findOne({
    $or: [{ cnic: formattedCnic }, { email }],
  });
  if (existingCustomer) {
    const message =
      existingCustomer.cnic === formattedCnic
        ? 'CNIC already registered'
        : 'Email already registered';
    return res.status(400).json({ success: false, message });
  }

  const customer = await Customer.create({
    fullName,
    fatherName,
    cnic: formattedCnic,
    phone,
    email,
    address,
  });

  const user = await User.create({
    name: fullName,
    email,
    password,
    phone,
    role: 'customer',
    customerRef: customer._id,
  });

  customer.user = user._id;
  await customer.save();

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerRef: customer._id,
        token: generateToken(user._id, user.role),
      },
      customer,
    },
  });
});

export const register = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password, phone, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'customer',
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('customerRef');
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, profileImage },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, isActive },
    { new: true, runValidators: true }
  ).select('-password');
  res.json({ success: true, data: user });
});
