import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, FolderKanban } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有必填字段');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    const result = await register(email, password, name);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '注册失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-800/20 to-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/5 to-cyan-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <FolderKanban className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">创建账号</h1>
          <p className="text-slate-500">加入素材管理平台，开启高效协作</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                用户名
              </label>
              <div className="relative">
                <div
                  className={cn(
                    'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'name' ? 'text-indigo-600' : 'text-slate-400'
                  )}
                >
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="请输入用户名"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-lg border transition-all duration-200 outline-none',
                    focusedField === 'name'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                    error && !name ? 'border-red-300 bg-red-50' : ''
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                邮箱地址
              </label>
              <div className="relative">
                <div
                  className={cn(
                    'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'email' ? 'text-indigo-600' : 'text-slate-400'
                  )}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.com"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-lg border transition-all duration-200 outline-none',
                    focusedField === 'email'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                    error && !email ? 'border-red-300 bg-red-50' : ''
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                密码
              </label>
              <div className="relative">
                <div
                  className={cn(
                    'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'password' ? 'text-indigo-600' : 'text-slate-400'
                  )}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="至少6位字符"
                  className={cn(
                    'w-full pl-12 pr-12 py-3 rounded-lg border transition-all duration-200 outline-none',
                    focusedField === 'password'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                    error && !password ? 'border-red-300 bg-red-50' : ''
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                确认密码
              </label>
              <div className="relative">
                <div
                  className={cn(
                    'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'confirmPassword' ? 'text-indigo-600' : 'text-slate-400'
                  )}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="再次输入密码"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-lg border transition-all duration-200 outline-none',
                    focusedField === 'confirmPassword'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                    error && !confirmPassword ? 'border-red-300 bg-red-50' : ''
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-200 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>注册中...</span>
                </div>
              ) : (
                '创建账号'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">或者</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              已有账号?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
