import { useState } from 'react';
import { useRouter } from 'next/router';
import useLoginStore from '@/stores/loginStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useLoginStore((state) => state.login);
  const isLoggedIn = useLoginStore((state) => state.isLoggedIn);
  const user = useLoginStore((state) => state.user);
  console.log('isLoggedIn', isLoggedIn, 'user', user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await window.electronAPI.login(phoneNumber, passcode);
      if (response.success) {
        login(response.staff);
        router.push('/');
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Staff Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
