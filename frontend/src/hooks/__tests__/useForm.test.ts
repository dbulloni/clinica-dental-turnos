import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  const initialValues = {
    email: '',
    password: '',
    name: '',
  };

  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      minLength: 6,
    },
    name: {
      required: true,
      minLength: 2,
    },
  };

  it('initializes with correct default values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates values when handleChange is called', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com', type: 'email' },
      } as any);
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('validates required fields', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'email' },
      } as any);
    });

    expect(result.current.errors.email).toBe('Este campo es requerido');
    expect(result.current.touched.email).toBe(true);
  });

  it('validates email pattern', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'invalid-email', type: 'email' },
      } as any);
    });

    act(() => {
      result.current.handleBlur({
        target: { name: 'email' },
      } as any);
    });

    expect(result.current.errors.email).toBe('Formato inválido');
  });

  it('validates minimum length', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: '123', type: 'password' },
      } as any);
    });

    act(() => {
      result.current.handleBlur({
        target: { name: 'password' },
      } as any);
    });

    expect(result.current.errors.password).toBe('Debe tener al menos 6 caracteres');
  });

  it('clears errors when user starts typing', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    // First, create an error
    act(() => {
      result.current.handleBlur({
        target: { name: 'email' },
      } as any);
    });

    expect(result.current.errors.email).toBe('Este campo es requerido');

    // Then, start typing to clear the error
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 't', type: 'email' },
      } as any);
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('validates entire form correctly', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    // Form should be invalid when empty (required fields)
    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    // Fill in valid values
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValue('password', 'password123');
      result.current.setFieldValue('name', 'John Doe');
    });

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(true);
    });
  });

  it('resets form correctly', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    // Make some changes
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldError('password', 'Some error');
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('handles form submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() =>
      useForm({ 
        initialValues: { email: 'test@example.com', password: 'password123', name: 'John' }, 
        validationRules,
        onSubmit 
      })
    );

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: 'John',
    });
  });
});