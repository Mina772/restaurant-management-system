import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../features/auth/authSlice.js';
import AuthShell from '../components/layout/AuthShell.jsx';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useSelector((s) => s.auth.error);
  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to order, track, and reserve.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" autoComplete="email"
            {...register('email', { required: 'Email is required' })} />
          {errors.email && <div className="error-text">{errors.email.message}</div>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className="input" autoComplete="current-password"
            {...register('password', { required: 'Password is required' })} />
          {errors.password && <div className="error-text">{errors.password.message}</div>}
        </div>

        {error && <div className="error-text" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="row between" style={{ marginTop: 16, fontSize: '0.9rem' }}>
        <Link to="/forgot-password" className="text-muted">Forgot password?</Link>
        <Link to="/register">Create account</Link>
      </div>

      <div className="card" style={{ padding: 12, marginTop: 20, fontSize: '0.82rem' }}>
        <strong>Demo:</strong> admin@restaurant.dev / Admin@12345 · customer@restaurant.dev / User@12345
      </div>
    </AuthShell>
  );
}
