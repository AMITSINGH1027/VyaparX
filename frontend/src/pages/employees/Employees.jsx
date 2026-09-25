import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Calendar, DollarSign, Check, X,
  Clock, Shield, Mail, Phone, Briefcase, Trash2
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const Employees = () => {
  const { business, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState('directory');
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const [empForm, setEmpForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: 'Sales Executive',
    department: 'Sales',
    base_salary: 25000,
  });

  const [payForm, setPayForm] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    base_salary: 25000,
    bonus: 2000,
    deductions: 500,
    payment_method: 'Bank Transfer',
    notes: 'Monthly regular payroll',
  });

  const currency = business?.currency_symbol || '₹';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/?limit=50');
      setEmployees(res.data.items);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/employees/attendance/today');
      setAttendance(res.data);
    } catch (err) {
      console.error('Failed to load attendance', err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await api.get('/employees/payroll/history');
      setPayrolls(res.data);
    } catch (err) {
      console.error('Failed to load payroll history', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchPayrolls();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees/', empForm);
      setShowEmpModal(false);
      setEmpForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        designation: 'Sales Executive',
        department: 'Sales',
        base_salary: 25000,
      });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create employee');
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove employee '${name}'?`)) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  const handleLogAttendance = async (empId, status) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/employees/attendance/log', {
        employee_id: empId,
        date: todayStr,
        status: status,
        check_in: status === 'PRESENT' ? '09:30 AM' : null,
      });
      fetchAttendance();
    } catch (err) {
      alert('Failed to log attendance');
    }
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees/payroll/process', payForm);
      setShowPayModal(false);
      fetchPayrolls();
      alert('Payroll processed and expense entry logged automatically!');
    } catch (err) {
      alert('Failed to process payroll');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Team, HR & Attendance Operations
          </h1>
          <p className="text-xs text-slate-400">
            Manage employee directory, track daily check-ins, and process monthly payroll disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <button
                onClick={() => {
                  if (employees.length > 0) {
                    setPayForm({
                      ...payForm,
                      employee_id: employees[0].id,
                      base_salary: employees[0].base_salary,
                    });
                  }
                  setShowPayModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors"
              >
                <DollarSign className="w-4 h-4" /> Process Salary
              </button>
              <button
                onClick={() => setShowEmpModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'directory' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" /> Employee Roster ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'attendance' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" /> Daily Attendance Ledger
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'payroll' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Salary & Payroll History
        </button>
      </div>

      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                    {emp.first_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{emp.designation}</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDeleteEmployee(emp.id, `${emp.first_name} ${emp.last_name}`)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> {emp.email}
                </p>
                {emp.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {emp.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Department: {emp.department}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Monthly Base Salary</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {currency}{emp.base_salary?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Today's Attendance ({new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Check-In Time</th>
                  <th className="py-3 px-4 font-bold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {employees.map((emp) => {
                  const record = attendance.find((a) => a.employee_id === emp.id);
                  const currentStatus = record?.status || 'ABSENT';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{emp.department}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={currentStatus === 'PRESENT' ? 'success' : currentStatus === 'ON_LEAVE' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {currentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {record?.check_in || '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleLogAttendance(emp.id, 'PRESENT')}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                        >
                          Mark Present
                        </button>
                        <button
                          onClick={() => handleLogAttendance(emp.id, 'ON_LEAVE')}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                        >
                          Leave
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Disbursement Date</th>
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Month / Year</th>
                  <th className="py-3 px-4 font-bold text-right">Base</th>
                  <th className="py-3 px-4 font-bold text-right">Bonus</th>
                  <th className="py-3 px-4 font-bold text-right">Deduction</th>
                  <th className="py-3 px-4 font-bold text-right">Net Paid</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(p.payment_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.employee_name || 'Staff Member'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {p.month}/{p.year}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {currency}{p.base_salary?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      +{currency}{p.bonus?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-medium">
                      -{currency}{p.deductions?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      {currency}{p.net_salary?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" size="sm">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showEmpModal} onClose={() => setShowEmpModal(false)} title="Register Team Member">
        <form onSubmit={handleCreateEmployee} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">First Name *</label>
              <input
                type="text"
                required
                value={empForm.first_name}
                onChange={(e) => setEmpForm({ ...empForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={empForm.last_name}
                onChange={(e) => setEmpForm({ ...empForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={empForm.email}
                onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number</label>
              <input
                type="tel"
                value={empForm.phone}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Designation</label>
              <input
                type="text"
                value={empForm.designation}
                onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Department</label>
              <input
                type="text"
                value={empForm.department}
                onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Base Salary ({currency})</label>
              <input
                type="number"
                value={empForm.base_salary}
                onChange={(e) => setEmpForm({ ...empForm, base_salary: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEmpModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Process Salary Disbursement">
        <form onSubmit={handleProcessPayroll} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Select Employee *</label>
            <select
              value={payForm.employee_id}
              onChange={(e) => {
                const emp = employees.find((x) => x.id === e.target.value);
                setPayForm({
                  ...payForm,
                  employee_id: e.target.value,
                  base_salary: emp ? emp.base_salary : 25000,
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Base Salary</label>
              <input
                type="number"
                value={payForm.base_salary}
                onChange={(e) => setPayForm({ ...payForm, base_salary: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Bonus</label>
              <input
                type="number"
                value={payForm.bonus}
                onChange={(e) => setPayForm({ ...payForm, bonus: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Deductions</label>
              <input
                type="number"
                value={payForm.deductions}
                onChange={(e) => setPayForm({ ...payForm, deductions: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-surface-800 rounded-xl flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Net Payable Amount</span>
            <span className="text-base font-black text-brand-600">
              {currency}{(payForm.base_salary + payForm.bonus - payForm.deductions).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
            >
              Disburse Salary
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
