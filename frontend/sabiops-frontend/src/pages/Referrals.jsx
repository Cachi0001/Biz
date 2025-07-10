import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import toast from 'react-hot-toast';
import { getReferralStats, getWithdrawals, requestWithdrawal, getErrorMessage } from '../services/api';

const Referrals = () => {
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount: '',
    withdrawal_method: 'bank_transfer',
    bank_name: '',
    account_number: '',
    account_name: '',
    bank_code: '',
    recipient_code: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchWithdrawals();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getReferralStats();
      setStats(response);
    } catch (error) {
      toast.error('Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await getWithdrawals();
      setWithdrawals(response.withdrawals || []);
    } catch (error) {
      toast.error('Failed to load withdrawals');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validate required fields
      const required = ['amount', 'bank_name', 'account_number', 'account_name', 'bank_code'];
      for (const field of required) {
        if (!form[field]) {
          toast.error(`${field.replace('_', ' ')} is required`);
          setSubmitting(false);
          return;
        }
      }
      await requestWithdrawal(form);
      toast.success('Withdrawal request submitted!');
      setForm({
        amount: '',
        withdrawal_method: 'bank_transfer',
        bank_name: '',
        account_number: '',
        account_name: '',
        bank_code: '',
        recipient_code: ''
      });
      fetchWithdrawals();
      fetchStats();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to submit withdrawal'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Referral Dashboard</CardTitle>
          <CardDescription>Track your earnings and request withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-lg font-semibold">Total Earnings</div>
                <div className="text-2xl font-bold text-green-600">₦{stats.total_earnings?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="text-lg font-semibold">Available Balance</div>
                <div className="text-2xl font-bold text-blue-600">₦{stats.available_balance?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="text-lg font-semibold">Total Withdrawn</div>
                <div className="text-2xl font-bold text-gray-600">₦{stats.total_withdrawn?.toLocaleString() || 0}</div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount to Withdraw (₦)*</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1000"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  placeholder="Enter amount (min ₦1000)"
                />
              </div>
              <div>
                <Label htmlFor="withdrawal_method">Withdrawal Method</Label>
                <Select
                  value={form.withdrawal_method}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, withdrawal_method: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bank_name">Bank Name*</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Access Bank"
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number*</Label>
                <Input
                  id="account_number"
                  name="account_number"
                  value={form.account_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 0123456789"
                />
              </div>
              <div>
                <Label htmlFor="account_name">Account Name*</Label>
                <Input
                  id="account_name"
                  name="account_name"
                  value={form.account_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <Label htmlFor="bank_code">Bank Code*</Label>
                <Input
                  id="bank_code"
                  name="bank_code"
                  value={form.bank_code}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 044 for Access Bank"
                />
              </div>
              <div>
                <Label htmlFor="recipient_code">Recipient Code (if required)</Label>
                <Input
                  id="recipient_code"
                  name="recipient_code"
                  value={form.recipient_code}
                  onChange={handleChange}
                  placeholder="Paystack recipient code (optional)"
                />
              </div>
            </div>
            <Button type="submit" className="mt-4" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Request Withdrawal'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No withdrawals yet.</TableCell>
                </TableRow>
              ) : (
                withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{new Date(w.requested_at || w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>₦{w.amount?.toLocaleString()}</TableCell>
                    <TableCell>{w.status}</TableCell>
                    <TableCell>{w.bank_name}</TableCell>
                    <TableCell>{w.account_number}</TableCell>
                    <TableCell>{w.reference_number}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals; 