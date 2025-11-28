import { Calendar, Clock, Plus, Minus } from 'lucide-react';

interface RentalDetailsProps {
  rentalDays: number;
  eventDate: string;
  eventTime: string;
  onRentalDaysChange: (days: number) => void;
  onEventDateChange: (date: string) => void;
  onEventTimeChange: (time: string) => void;
}

export default function RentalDetails({
  rentalDays,
  eventDate,
  eventTime,
  onRentalDaysChange,
  onEventDateChange,
  onEventTimeChange,
}: RentalDetailsProps) {
  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeliverySchedule = (eventDateStr: string, eventTimeStr: string) => {
    if (!eventDateStr) return null;

    const eventDate = new Date(eventDateStr + 'T00:00:00');
    const nextDay = new Date(eventDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
      deliveryDate: eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }),
      pickupDate: nextDay.toLocaleDateString('en-US', {
        weekday: 'short',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }),
    };
  };

  const schedule = getDeliverySchedule(eventDate, eventTime);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How many days do you want to use the equipment?
        </h3>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onRentalDaysChange(Math.max(1, rentalDays - 1))}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{rentalDays}</div>
            <div className="text-sm text-gray-600">day{rentalDays !== 1 ? 's' : ''}</div>
          </div>
          <button
            onClick={() => onRentalDaysChange(rentalDays + 1)}
            className="w-10 h-10 rounded-lg border-2 border-green-500 bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Select Event Date</h3>
        </div>

        <input
          type="date"
          value={eventDate}
          onChange={(e) => onEventDateChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
        />

        {eventDate && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Your event is scheduled for <span className="font-semibold">{formatEventDate(eventDate)}</span>
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Event Start Time</h3>
        </div>

        <input
          type="time"
          value={eventTime}
          onChange={(e) => onEventTimeChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
        />

        {schedule && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Rental Duration: {rentalDays} day{rentalDays !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-600">Event range time: 12:00 PM - 11:00 PM</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">• Delivery Same day:</span> {schedule.deliveryDate} between 8:00 AM - 10:00 AM
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">• Pickup:</span> {schedule.pickupDate} between 8:00 AM - 10:00 AM
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
