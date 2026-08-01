import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../api/client.js';
import AuthShell from '../components/layout/AuthShell.jsx';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a reset link.">
      {sent ? (
        <div className="center">
          <p>If an account exists for that email, a reset link is on its way. 📬</p>
          <Link to="/login" className="btn btn-primary btn-block">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="input" {...register('email', { required: 'Email is required' })} />
            {errors.email && <div className="error-text">{errors.email.message}</div>}
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="center" style={{ marginTop: 16 }}><Link to="/login" className="text-muted">Back to sign in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
