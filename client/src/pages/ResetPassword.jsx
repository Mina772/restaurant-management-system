import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiError } from '../api/client.js';
import AuthShell from '../components/layout/AuthShell.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset — please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(apiError(err, 'Reset failed'));
    }
  };

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or malformed.">
        <Link to="/forgot-password" className="btn btn-primary btn-block">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input id="password" type="password" className="input" autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              pattern: { value: /^(?=.*[A-Z])(?=.*\d).+$/, message: 'Needs an uppercase letter and a number' },
            })} />
          {errors.password && <div className="error-text">{errors.password.message}</div>}
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" className="input" autoComplete="new-password"
            {...register('confirm', { validate: (v) => v === watch('password') || 'Passwords do not match' })} />
          {errors.confirm && <div className="error-text">{errors.confirm.message}</div>}
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  );
}
