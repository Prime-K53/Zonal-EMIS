import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { GraduationCap, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Successfully logged in');
      } else {
        await register(name, email, password);
        toast.success('Successfully registered');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-6 font-serif">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[#5A5A40] text-white shadow-xl mb-6">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">Zonal EMIS</h1>
          <p className="text-[#5A5A40]/60 italic">Education Management Information System</p>
        </div>

        <Card className="p-10 shadow-2xl border-none ring-1 ring-[#5A5A40]/10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[#5A5A40]/60 text-sm mt-1">
              {isLogin ? 'Please enter your credentials to access your zone.' : 'Join the Zonal EMIS network.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/60 uppercase tracking-widest pl-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/30" size={18} />
                  <Input 
                    required 
                    placeholder="Enter your full name" 
                    className="pl-12 h-12 bg-[#f5f5f0]/50 border-transparent focus:bg-white transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5A5A40]/60 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/30" size={18} />
                <Input 
                  required 
                  type="email" 
                  placeholder="name@emis.gov.mw" 
                  className="pl-12 h-12 bg-[#f5f5f0]/50 border-transparent focus:bg-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-[#5A5A40]/60 uppercase tracking-widest">Password</label>
                {isLogin && <button type="button" className="text-xs font-bold text-[#5A5A40]">Forgot?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/30" size={18} />
                <Input 
                  required 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-12 bg-[#f5f5f0]/50 border-transparent focus:bg-white transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#5A5A40] hover:bg-[#4A4A30] text-white shadow-lg shadow-[#5A5A40]/20 gap-2 text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? <><LogIn size={20} /> Sign In</> : <><UserPlus size={20} /> Register</>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-[#5A5A40]/5">
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-[#5A5A40] hover:underline"
            >
              {isLogin ? "Don't have an account? Register as TDC Officer" : "Already have an account? Sign In"}
            </button>
          </div>
        </Card>
        
        <p className="mt-8 text-center text-xs text-[#5A5A40]/40 italic">
          Authorized personnel only. All access is logged and recorded.
        </p>
      </div>
    </div>
  );
};
