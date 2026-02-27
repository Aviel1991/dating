import EventForm from '@/components/admin/EventForm';

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">אירוע חדש</h1>
      <EventForm />
    </div>
  );
}
