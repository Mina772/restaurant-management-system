import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiError } from '../api/client.js';
import { selectUser } from '../features/auth/authSlice.js';
import { dateTime } from '../utils/format.js';

export default function Reservations() {
  const user = useSelector(selectUser);
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { guestName: user?.name, guestPhone: user?.phone || '', partySize: 2 },
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => (await api.get('/reservations/mine')).data.data,
  });

  const onSubmit = async (values) => {
    try {
      await api.post('/reservations', { ...values, partySize: Number(values.partySize) });
      toast.success('Reservation requested!');
      reset({ ...values, specialRequests: '' });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    } catch (err) {
      toast.error(apiError(err, 'Could not create reservation'));
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container section">
      <h1>Reserve a table</h1>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }}>
        <form className="card" style={{ padding: 24 }} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label>Name</label>
            <input className="input" {...register('guestName', { required: 'Required' })} />
            {errors.guestName && <div className="error-text">{errors.guestName.message}</div>}
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" {...register('guestPhone', { required: 'Required' })} />
            {errors.guestPhone && <div className="error-text">{errors.guestPhone.message}</div>}
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Date</label>
              <input type="date" min={today} className="input" {...register('date', { required: 'Required' })} />
              {errors.date && <div className="error-text">{errors.date.message}</div>}
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Time</label>
              <input type="time" className="input" {...register('time', { required: 'Required' })} />
              {errors.time && <div className="error-text">{errors.time.message}</div>}
            </div>
            <div className="field" style={{ width: 110 }}>
              <label>Guests</label>
              <input type="number" min={1} max={30} className="input" {...register('partySize', { required: true })} />
            </div>
          </div>
          <div className="field">
            <label>Special requests</label>
            <textarea className="textarea" rows={3} {...register('specialRequests')} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Request reservation'}
          </button>
        </form>

        <div>
          <h2>Your reservations</h2>
          {reservations?.length === 0 && <p className="text-muted">No reservations yet.</p>}
          <div className="stack">
            {reservations?.map((r) => (
              <div key={r._id} className="card row between" style={{ padding: 16 }}>
                <div>
                  <strong>{r.partySize} guests</strong>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(r.date).toLocaleDateString()} at {r.time}
                    {r.table ? ` · Table ${r.table.number}` : ''}
                  </div>
                </div>
                <span className="badge">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 780px){ .section .grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
