import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerThunk } from '../features/auth/authSlice.js';
import AuthShell from '../components/layout/AuthShell.jsx';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async ({ confirm, ...values }) => {
    const result = await dispatch(registerThunk(values));
    if (registerThunk.fulfilled.match(result)) {
      toast.success('Account created! Check your email to verify.');
      navigate('/');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join Savoria and start ordering.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" className="input" autoComplete="name" {...register('name', { required: 'Name is required' })} />
          {errors.name && <div className="error-text">{errors.name.message}</div>}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" autoComplete="email"
            {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
          {errors.email && <div className="error-text">{errors.email.message}</div>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="center text-muted" style={{ marginTop: 16, fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
