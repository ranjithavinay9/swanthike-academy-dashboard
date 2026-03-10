import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from './config';

const emptyStudent = {
  Full_Name: '',
  Gender: 'Male',
  DOB: '',
  Parent_Name: '',
  Parent_Phone: '',
  Email: '',
  Address: '',
  Course_ID: '',
  Batch_ID: '',
  Join_Date: '',
  Status: 'Active'
};

const emptyPayment = {
  Student_ID: '',
  Amount: '',
  Payment_Mode: 'Cash',
  Receipt_No: ''
};

function isConfigured() {
  return !API_BASE.includes('PASTE_YOUR_APPS_SCRIPT');
}

async function getJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

function StatCard({ label, value, helper }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-helper">{helper}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-title-row">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [dashboard, setDashboard] = useState({
    total_students: 0,
    payments_recorded: 0,
    attendance_records: 0
  });

  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceBy, setAttendanceBy] = useState('Faculty');
  const [attendanceStudentId, setAttendanceStudentId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [addingStudent, setAddingStudent] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [updatingStudent, setUpdatingStudent] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [feesRows, setFeesRows] = useState([]);
  const [paymentRows, setPaymentRows] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);

  const batchOptions = useMemo(
    () => [...new Set(students.map((s) => s.Batch_ID).filter(Boolean))],
    [students]
  );

  const courseOptions = useMemo(
    () => [...new Set(students.map((s) => s.Course_ID).filter(Boolean))],
    [students]
  );

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      Object.values(student).join(' ').toLowerCase().includes(q)
    );
  }, [students, query]);

  const attendanceFilteredStudents = useMemo(() => {
    const q = attendanceSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      [student.Student_ID, student.Full_Name, student.Parent_Name, student.Batch_ID, student.Course_ID]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [students, attendanceSearch]);

  const selectedAttendanceStudent = useMemo(() => {
    return students.find((student) => student.Student_ID === attendanceStudentId) || null;
  }, [students, attendanceStudentId]);

  const profileSummary = useMemo(() => {
    if (!selectedStudent) return null;

    const fee = feesRows[0] || {};
    const totalPaid = paymentRows.reduce(
      (sum, row) => sum + (Number(String(row.Amount || 0).replace(/[^0-9.-]/g, '')) || 0),
      0
    );
    const attendanceCount = attendanceRows.length;
    const presentCount = attendanceRows.filter(
      (row) => String(row.Status || '').toLowerCase() === 'present'
    ).length;

    const latestPayment = paymentRows.length ? paymentRows[paymentRows.length - 1] : null;
    const latestAttendance = attendanceRows.length ? attendanceRows[attendanceRows.length - 1] : null;

    return {
      netFee: fee.Net_Fee || 0,
      balance: fee.Balance || 0,
      feeStatus: fee.Status || '-',
      totalPaid,
      attendanceCount,
      presentCount,
      latestPayment,
      latestAttendance
    };
  }, [selectedStudent, feesRows, paymentRows, attendanceRows]);

  async function loadData() {
    if (!isConfigured()) {
      setError('Open src/config.js and paste your Apps Script Web App URL into API_BASE.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const [studentData, dashboardData] = await Promise.all([
        getJson(`${API_BASE}?action=students`),
        getJson(`${API_BASE}?action=dashboard`)
      ]);

      const safeStudents = Array.isArray(studentData) ? studentData : [];
      setStudents(safeStudents);
      setDashboard(dashboardData || {});

      if (!attendanceStudentId && safeStudents.length) {
        setAttendanceStudentId(safeStudents[0].Student_ID || '');
      }
    } catch (err) {
      setError(err.message || 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function postAction(payload) {
    return getJson(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  }

  async function openStudentProfile(student) {
    setError('');
    setMessage('');

    try {
      const result = await getJson(
        `${API_BASE}?action=studentProfile&studentId=${encodeURIComponent(student.Student_ID)}`
      );

      const profileStudent = result.student || student;

      setSelectedStudent(profileStudent);
      setEditingStudent({
        Full_Name: profileStudent.Full_Name || '',
        Gender: profileStudent.Gender || 'Male',
        DOB: formatDateForInput(profileStudent.DOB),
        Parent_Name: profileStudent.Parent_Name || '',
        Parent_Phone: profileStudent.Parent_Phone || '',
        Email: profileStudent.Email || '',
        Address: profileStudent.Address || '',
        Course_ID: profileStudent.Course_ID || '',
        Batch_ID: profileStudent.Batch_ID || '',
        Join_Date: formatDateForInput(profileStudent.Join_Date),
        Status: profileStudent.Status || 'Active'
      });

      setFeesRows(Array.isArray(result.fees) ? result.fees : []);
      setPaymentRows(Array.isArray(result.payments) ? result.payments : []);
      setAttendanceRows(Array.isArray(result.attendance) ? result.attendance : []);
    } catch (err) {
      setError(err.message || 'Unable to load student profile.');
    }
  }

  function closeStudentProfile() {
    setSelectedStudent(null);
    setEditingStudent(null);
    setFeesRows([]);
    setPaymentRows([]);
    setAttendanceRows([]);
  }

  function formatDateForInput(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!studentForm.Full_Name || !studentForm.Course_ID || !studentForm.Batch_ID) {
      setError('Full name, course ID, and batch ID are required.');
      return;
    }

    try {
      setAddingStudent(true);

      const result = await postAction({
        action: 'addStudent',
        ...studentForm
      });

      setMessage(
        `Student added successfully. New Student ID: ${result.Student_ID}, Fee Record: ${result.Fee_Record_ID}`
      );
      setStudentForm(emptyStudent);
      await loadData();
      setTab('students');
    } catch (err) {
      setError(err.message || 'Unable to add student.');
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleUpdateStudent(e) {
    e.preventDefault();
    if (!selectedStudent || !editingStudent) return;

    setError('');
    setMessage('');

    if (!editingStudent.Full_Name || !editingStudent.Course_ID || !editingStudent.Batch_ID) {
      setError('Full name, course ID, and batch ID are required.');
      return;
    }

    try {
      setUpdatingStudent(true);

      const result = await postAction({
        action: 'updateStudent',
        Student_ID: selectedStudent.Student_ID,
        ...editingStudent
      });

      setMessage(result.status || 'Student updated successfully.');
      await loadData();
      await openStudentProfile({ Student_ID: selectedStudent.Student_ID });
    } catch (err) {
      setError(err.message || 'Unable to update student.');
    } finally {
      setUpdatingStudent(false);
    }
  }

  async function handleSaveAttendance() {
    setError('');
    setMessage('');

    if (!attendanceStudentId) {
      setError('Please select a student.');
      return;
    }

    if (!selectedAttendanceStudent) {
      setError('Selected student not found.');
      return;
    }

    try {
      setSavingAttendance(true);

      await postAction({
        action: 'markAttendance',
        Student_ID: selectedAttendanceStudent.Student_ID,
        Batch_ID: selectedAttendanceStudent.Batch_ID,
        Status: attendanceStatus,
        Date: attendanceDate,
        Marked_By: attendanceBy
      });

      setMessage(`Attendance saved for ${selectedAttendanceStudent.Full_Name}.`);
      await loadData();

      if (selectedStudent && selectedStudent.Student_ID === selectedAttendanceStudent.Student_ID) {
        await openStudentProfile({ Student_ID: selectedStudent.Student_ID });
      }
    } catch (err) {
      setError(err.message || 'Unable to save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!paymentForm.Student_ID || !paymentForm.Amount) {
      setError('Student ID and amount are required.');
      return;
    }

    try {
      setRecordingPayment(true);

      const result = await postAction({
        action: 'recordPayment',
        ...paymentForm
      });

      setMessage(`Payment recorded successfully. Remaining balance: ${result.balance ?? 'updated'}`);
      const paidStudentId = paymentForm.Student_ID;
      setPaymentForm(emptyPayment);
      await loadData();

      if (selectedStudent && selectedStudent.Student_ID === paidStudentId) {
        await openStudentProfile({ Student_ID: selectedStudent.Student_ID });
      }
    } catch (err) {
      setError(err.message || 'Unable to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">SA</div>
          <div>
            <h1>Swanthike Academy</h1>
            <p>Frontend Dashboard</p>
          </div>
        </div>

        <nav className="nav-list">
          {[
            ['dashboard', 'Dashboard'],
            ['students', 'Students'],
            ['attendance', 'Attendance'],
            ['payments', 'Payments']
          ].map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'nav-button active' : 'nav-button'}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-box">
          <div className="sidebar-label">API Base</div>
          <div className="sidebar-value">{API_BASE}</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h2>Academy Management System</h2>
            <p>React frontend connected to Google Sheets through Apps Script.</p>
          </div>
          <button className="primary-button" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

        {tab === 'dashboard' && (
          <div className="page-grid">
            <div className="stats-grid">
              <StatCard label="Total Students" value={dashboard.total_students || 0} helper="From Students sheet" />
              <StatCard label="Payments Recorded" value={dashboard.payments_recorded || 0} helper="From Payments sheet" />
              <StatCard label="Attendance Records" value={dashboard.attendance_records || 0} helper="From Attendance sheet" />
            </div>

            <div className="card">
              <SectionTitle title="Next setup step" subtitle="Configure the frontend once, then use it daily." />
              <ol className="steps-list">
                <li>Open <code>src/config.js</code>.</li>
                <li>Paste your Apps Script URL into <code>API_BASE</code>.</li>
                <li>Run <code>npm install</code>.</li>
                <li>Run <code>npm run dev</code>.</li>
                <li>Open the local Vite URL in your browser.</li>
              </ol>
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div className={selectedStudent ? 'three-column-grid' : 'two-column-grid'}>
            <div className="card">
              <SectionTitle title="Student Directory" subtitle="Live records from the Students sheet" />
              <input
                className="text-input"
                placeholder="Search student, parent, course, batch..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="list-stack">
                {filteredStudents.map((student) => (
                  <div
                    key={student.Student_ID}
                    className="list-item clickable"
                    onClick={() => openStudentProfile(student)}
                  >
                    <div>
                      <div className="item-title">{student.Full_Name || 'Unnamed Student'}</div>
                      <div className="item-subtitle">{student.Student_ID} • {student.Course_ID} • {student.Batch_ID}</div>
                      <div className="item-meta">Parent: {student.Parent_Name || '-'} • {student.Parent_Phone || '-'}</div>
                    </div>
                    <span className="pill">{student.Status || 'Active'}</span>
                  </div>
                ))}
                {!filteredStudents.length && <div className="empty-state">No students found.</div>}
              </div>
            </div>

            <div className="card">
              <SectionTitle title="Add Student" subtitle="This form writes directly to Google Sheets" />
              <form className="form-grid" onSubmit={handleAddStudent}>
                <label>
                  <span>Student ID</span>
                  <input className="text-input" value="Auto-generated" readOnly />
                </label>

                <label>
                  <span>Full Name</span>
                  <input className="text-input" value={studentForm.Full_Name} onChange={(e) => setStudentForm({ ...studentForm, Full_Name: e.target.value })} />
                </label>

                <label>
                  <span>Gender</span>
                  <select className="text-input" value={studentForm.Gender} onChange={(e) => setStudentForm({ ...studentForm, Gender: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </label>

                <label>
                  <span>DOB</span>
                  <input type="date" className="text-input" value={studentForm.DOB} onChange={(e) => setStudentForm({ ...studentForm, DOB: e.target.value })} />
                </label>

                <label>
                  <span>Parent Name</span>
                  <input className="text-input" value={studentForm.Parent_Name} onChange={(e) => setStudentForm({ ...studentForm, Parent_Name: e.target.value })} />
                </label>

                <label>
                  <span>Parent Phone</span>
                  <input className="text-input" value={studentForm.Parent_Phone} onChange={(e) => setStudentForm({ ...studentForm, Parent_Phone: e.target.value })} />
                </label>

                <label className="full-width">
                  <span>Email</span>
                  <input className="text-input" value={studentForm.Email} onChange={(e) => setStudentForm({ ...studentForm, Email: e.target.value })} />
                </label>

                <label className="full-width">
                  <span>Address</span>
                  <input className="text-input" value={studentForm.Address} onChange={(e) => setStudentForm({ ...studentForm, Address: e.target.value })} />
                </label>

                <label>
                  <span>Course ID</span>
                  <input list="course-options" className="text-input" value={studentForm.Course_ID} onChange={(e) => setStudentForm({ ...studentForm, Course_ID: e.target.value })} />
                  <datalist id="course-options">
                    {courseOptions.map((id) => <option key={id} value={id} />)}
                  </datalist>
                </label>

                <label>
                  <span>Batch ID</span>
                  <input list="batch-options" className="text-input" value={studentForm.Batch_ID} onChange={(e) => setStudentForm({ ...studentForm, Batch_ID: e.target.value })} />
                  <datalist id="batch-options">
                    {batchOptions.map((id) => <option key={id} value={id} />)}
                  </datalist>
                </label>

                <label>
                  <span>Join Date</span>
                  <input type="date" className="text-input" value={studentForm.Join_Date} onChange={(e) => setStudentForm({ ...studentForm, Join_Date: e.target.value })} />
                </label>

                <label>
                  <span>Status</span>
                  <select className="text-input" value={studentForm.Status} onChange={(e) => setStudentForm({ ...studentForm, Status: e.target.value })}>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Completed</option>
                    <option>Dropped</option>
                  </select>
                </label>

                <button className="primary-button full-width" type="submit" disabled={addingStudent}>
                  {addingStudent ? 'Adding Student...' : 'Add Student'}
                </button>
              </form>
            </div>

            {selectedStudent && (
              <div className="card">
                <SectionTitle
                  title="Student Profile"
                  subtitle={`${selectedStudent.Full_Name} • ${selectedStudent.Student_ID}`}
                  action={<button className="secondary-button" onClick={closeStudentProfile}>Close</button>}
                />

                {profileSummary && (
                  <div className="profile-summary-grid">
                    <div className="mini-stat-card">
                      <div className="mini-stat-label">Net Fee</div>
                      <div className="mini-stat-value">{profileSummary.netFee}</div>
                    </div>
                    <div className="mini-stat-card">
                      <div className="mini-stat-label">Paid Total</div>
                      <div className="mini-stat-value">{profileSummary.totalPaid}</div>
                    </div>
                    <div className="mini-stat-card">
                      <div className="mini-stat-label">Balance</div>
                      <div className="mini-stat-value">{profileSummary.balance}</div>
                    </div>
                    <div className="mini-stat-card">
                      <div className="mini-stat-label">Attendance</div>
                      <div className="mini-stat-value">{profileSummary.presentCount}/{profileSummary.attendanceCount}</div>
                    </div>
                  </div>
                )}

                <div className="profile-section">
                  <h3>Edit Student</h3>
                  <form className="single-column-form" onSubmit={handleUpdateStudent}>
                    <label>
                      <span>Full Name</span>
                      <input className="text-input" value={editingStudent?.Full_Name || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Full_Name: e.target.value })} />
                    </label>

                    <label>
                      <span>Gender</span>
                      <select className="text-input" value={editingStudent?.Gender || 'Male'} onChange={(e) => setEditingStudent({ ...editingStudent, Gender: e.target.value })}>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </label>

                    <label>
                      <span>DOB</span>
                      <input type="date" className="text-input" value={editingStudent?.DOB || ''} onChange={(e) => setEditingStudent({ ...editingStudent, DOB: e.target.value })} />
                    </label>

                    <label>
                      <span>Parent Name</span>
                      <input className="text-input" value={editingStudent?.Parent_Name || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Parent_Name: e.target.value })} />
                    </label>

                    <label>
                      <span>Parent Phone</span>
                      <input className="text-input" value={editingStudent?.Parent_Phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Parent_Phone: e.target.value })} />
                    </label>

                    <label>
                      <span>Email</span>
                      <input className="text-input" value={editingStudent?.Email || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Email: e.target.value })} />
                    </label>

                    <label>
                      <span>Address</span>
                      <input className="text-input" value={editingStudent?.Address || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Address: e.target.value })} />
                    </label>

                    <label>
                      <span>Course ID</span>
                      <input list="course-options" className="text-input" value={editingStudent?.Course_ID || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Course_ID: e.target.value })} />
                    </label>

                    <label>
                      <span>Batch ID</span>
                      <input list="batch-options" className="text-input" value={editingStudent?.Batch_ID || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Batch_ID: e.target.value })} />
                    </label>

                    <label>
                      <span>Join Date</span>
                      <input type="date" className="text-input" value={editingStudent?.Join_Date || ''} onChange={(e) => setEditingStudent({ ...editingStudent, Join_Date: e.target.value })} />
                    </label>

                    <label>
                      <span>Status</span>
                      <select className="text-input" value={editingStudent?.Status || 'Active'} onChange={(e) => setEditingStudent({ ...editingStudent, Status: e.target.value })}>
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>Completed</option>
                        <option>Dropped</option>
                      </select>
                    </label>

                    <button className="primary-button" type="submit" disabled={updatingStudent}>
                      {updatingStudent ? 'Updating Student...' : 'Update Student'}
                    </button>
                  </form>
                </div>

                <div className="profile-section">
                  <h3>Latest Activity</h3>
                  <div className="mini-card">
                    <div><strong>Latest Payment:</strong> {profileSummary?.latestPayment ? `${profileSummary.latestPayment.Amount} on ${String(profileSummary.latestPayment.Payment_Date || '')}` : 'No payment found'}</div>
                    <div><strong>Latest Attendance:</strong> {profileSummary?.latestAttendance ? `${profileSummary.latestAttendance.Status} on ${String(profileSummary.latestAttendance.Date || '')}` : 'No attendance found'}</div>
                    <div><strong>Fee Status:</strong> {profileSummary?.feeStatus || '-'}</div>
                  </div>
                </div>

                <div className="profile-section">
                  <h3>Fee Details</h3>
                  {feesRows.length ? feesRows.map((row, idx) => (
                    <div key={idx} className="mini-card">
                      <div><strong>Net Fee:</strong> {row.Net_Fee}</div>
                      <div><strong>Paid:</strong> {row.Paid_Amount}</div>
                      <div><strong>Balance:</strong> {row.Balance}</div>
                      <div><strong>Status:</strong> {row.Status}</div>
                      <div><strong>Due Date:</strong> {String(row.Due_Date || '')}</div>
                    </div>
                  )) : <div className="empty-state">No fee record found.</div>}
                </div>

                <div className="profile-section">
                  <h3>Payment History</h3>
                  {paymentRows.length ? [...paymentRows].reverse().map((row, idx) => (
                    <div key={idx} className="mini-card">
                      <div><strong>Amount:</strong> {row.Amount}</div>
                      <div><strong>Mode:</strong> {row.Payment_Mode}</div>
                      <div><strong>Receipt:</strong> {row.Receipt_No}</div>
                      <div><strong>Date:</strong> {String(row.Payment_Date || '')}</div>
                    </div>
                  )) : <div className="empty-state">No payments found.</div>}
                </div>

                <div className="profile-section">
                  <h3>Attendance History</h3>
                  {attendanceRows.length ? [...attendanceRows].reverse().map((row, idx) => (
                    <div key={idx} className="mini-card">
                      <div><strong>Date:</strong> {String(row.Date || '')}</div>
                      <div><strong>Status:</strong> {row.Status}</div>
                      <div><strong>Marked By:</strong> {row.Marked_By}</div>
                      <div><strong>Batch:</strong> {row.Batch_ID}</div>
                    </div>
                  )) : <div className="empty-state">No attendance found.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'attendance' && (
          <div className="two-column-grid">
            <div className="card">
              <SectionTitle title="Mark Attendance" subtitle="Search, select one student, and save immediately." />

              <div className="single-column-form">
                <label>
                  <span>Search Student</span>
                  <input
                    className="text-input"
                    placeholder="Search by ID, name, parent, batch, course..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                  />
                </label>

                <label>
                  <span>Select Student</span>
                  <select
                    className="text-input"
                    value={attendanceStudentId}
                    onChange={(e) => setAttendanceStudentId(e.target.value)}
                  >
                    <option value="">Select student</option>
                    {attendanceFilteredStudents.map((student) => (
                      <option key={student.Student_ID} value={student.Student_ID}>
                        {student.Student_ID} - {student.Full_Name} - {student.Batch_ID}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    className="text-input"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </label>

                <label>
                  <span>Status</span>
                  <select
                    className="text-input"
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                  >
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Leave</option>
                  </select>
                </label>

                <label>
                  <span>Marked By</span>
                  <input
                    className="text-input"
                    value={attendanceBy}
                    onChange={(e) => setAttendanceBy(e.target.value)}
                  />
                </label>

                <button className="primary-button" onClick={handleSaveAttendance} disabled={!attendanceStudentId || savingAttendance}>
                  {savingAttendance ? 'Saving Attendance...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            <div className="card">
              <SectionTitle title="Selected Student" subtitle="Confirm details before saving." />
              {selectedAttendanceStudent ? (
                <div className="list-stack">
                  <div className="mini-card">
                    <div><strong>Name:</strong> {selectedAttendanceStudent.Full_Name}</div>
                    <div><strong>Student ID:</strong> {selectedAttendanceStudent.Student_ID}</div>
                    <div><strong>Course:</strong> {selectedAttendanceStudent.Course_ID}</div>
                    <div><strong>Batch:</strong> {selectedAttendanceStudent.Batch_ID}</div>
                    <div><strong>Parent:</strong> {selectedAttendanceStudent.Parent_Name || '-'}</div>
                    <div><strong>Status to Save:</strong> {attendanceStatus}</div>
                    <div><strong>Date:</strong> {attendanceDate}</div>
                  </div>
                  <button className="secondary-button" onClick={() => openStudentProfile(selectedAttendanceStudent)}>
                    Open Student Profile
                  </button>
                </div>
              ) : (
                <div className="empty-state">Select a student to mark attendance.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="two-column-grid">
            <div className="card">
              <SectionTitle title="Record Payment" subtitle="Writes to the Payments sheet" />
              <form className="single-column-form" onSubmit={handleRecordPayment}>
                <label>
                  <span>Student</span>
                  <select className="text-input" value={paymentForm.Student_ID} onChange={(e) => setPaymentForm({ ...paymentForm, Student_ID: e.target.value })}>
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.Student_ID} value={student.Student_ID}>
                        {student.Student_ID} - {student.Full_Name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Amount</span>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Enter amount like 3500"
                    value={paymentForm.Amount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9.]/g, '');
                      setPaymentForm({ ...paymentForm, Amount: clean });
                    }}
                  />
                </label>

                <label>
                  <span>Payment Mode</span>
                  <select className="text-input" value={paymentForm.Payment_Mode} onChange={(e) => setPaymentForm({ ...paymentForm, Payment_Mode: e.target.value })}>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                  </select>
                </label>

                <label>
                  <span>Receipt Number</span>
                  <input className="text-input" value={paymentForm.Receipt_No} onChange={(e) => setPaymentForm({ ...paymentForm, Receipt_No: e.target.value })} />
                </label>

                <button className="primary-button" type="submit" disabled={recordingPayment}>
                  {recordingPayment ? 'Recording Payment...' : 'Record Payment'}
                </button>
              </form>
            </div>

            <div className="card">
              <SectionTitle title="Quick Student List" subtitle="Useful while collecting fees" />
              <div className="list-stack">
                {students.slice(0, 10).map((student) => (
                  <div key={student.Student_ID} className="list-item">
                    <div>
                      <div className="item-title">{student.Full_Name}</div>
                      <div className="item-subtitle">{student.Student_ID} • {student.Course_ID} • {student.Batch_ID}</div>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => setPaymentForm({ ...paymentForm, Student_ID: student.Student_ID })}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
