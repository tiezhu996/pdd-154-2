import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, FolderKanban } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '登录失败');
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">素材管理平台</h1>
          <p className="text-slate-500">登录以访问您的素材库</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-pulse">
                {error}
              </div>
            )}

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
                  placeholder="请输入密码"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
                忘记密码?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登录中...</span>
                </div>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              还没有账号?{' '}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 素材管理平台. 保护您的创意资产
        </p>
      </div>
    </div>
  );
}
