import PageHeader from '../components/PageHeader';
import OwnershipRecordsPanel from '../components/OwnershipRecordsPanel';

export default function OwnershipRecords() {
  return (
    <div>
      <PageHeader
        title="Ownership Records"
        subtitle="Select block and plot/house number to see how many owners a property has had."
      />

      <div className="admin-table-wrap p-6">
        <OwnershipRecordsPanel />
      </div>
    </div>
  );
}
