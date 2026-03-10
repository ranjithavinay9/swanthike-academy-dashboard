import React, { useState } from "react";
import "./RegisterPage.css";

const courseOptions = [
  "Kannada Academic",
  "Bhagavad Gita",
  "Basic Shloka",
  "Hanuman Chalisa",
  "Astalakshmi Stothram",
  "Mahalakshmi Ashtakam",
  "Kanakadhara Stothram",
  "Basavanna Vachanagalu",
  "Kannada Speaking Class",
  "Lalitha Sahasranama"
];

const PARENT_REGISTRATION = "Parents Course Registration";
const STUDENT_REGISTRATION = "Student Course Registration";

export default function RegisterPage() {
  const [form, setForm] = useState({
    registration_type: "",
    parent_name: "",
    parent_phone: "",
    email: "",
    student_name: "",
    age: "",
    class_grade: "",
    course: "",
    address: "",
    remarks: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm({
      registration_type: "",
      parent_name: "",
      parent_phone: "",
      email: "",
      student_name: "",
      age: "",
      class_grade: "",
      course: "",
      address: "",
      remarks: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.registration_type) {
      alert("Please select registration type.");
      return;
    }

    if (!form.parent_name || !form.parent_phone || !form.course) {
      alert("Please fill all required parent details.");
      return;
    }

    if (
      form.registration_type === STUDENT_REGISTRATION &&
      (!form.student_name || !form.age || !form.class_grade)
    ) {
      alert("Please fill all required student details.");
      return;
    }

    setLoading(true);
    setSuccess("");

    try {
      const payload = {
        action: "registerEnquiry",
        registration_type: form.registration_type,
        student_name:
          form.registration_type === STUDENT_REGISTRATION ? form.student_name : "",
        parent_name: form.parent_name,
        phone: form.parent_phone,
        email: form.email,
        age: form.registration_type === STUDENT_REGISTRATION ? form.age : "",
        class_grade:
          form.registration_type === STUDENT_REGISTRATION ? form.class_grade : "",
        course: form.course,
        address: form.address,
        remarks: form.remarks
      };

      const response = await fetch(import.meta.env.VITE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();

      let result;
      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error("Backend did not return valid JSON: " + rawText);
      }

      if (result.status === "success") {
        setSuccess("Thank you! Your registration enquiry has been submitted successfully.");
        resetForm();
      } else {
        alert(result.error || "Something went wrong while submitting the form.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Submission failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isStudentRegistration =
    form.registration_type === STUDENT_REGISTRATION;

  const isParentRegistration =
    form.registration_type === PARENT_REGISTRATION;

  return (
    <div className="register-page">
      <div className="hero-section">
        <div className="hero-content">
          <p className="academy-badge">Admissions Open</p>

          <h1>Swanthike Online Academy</h1>

          <p className="hero-subtitle">Learn with Perfection</p>

          <p className="hero-text">
            Choose the registration type and submit your enquiry. Our academy team
            will contact you shortly with full course details.
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="form-card">
          <h2>Course Registration Form</h2>
          <p className="form-note">
            Please select the registration type first. Parent details are always required.
            Student details will appear when Student Course Registration is selected.
          </p>

          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <label className="field-label">Registration Type *</label>
            <select
              name="registration_type"
              value={form.registration_type}
              onChange={handleChange}
              required
            >
              <option value="">Select Registration Type</option>
              <option value={PARENT_REGISTRATION}>{PARENT_REGISTRATION}</option>
              <option value={STUDENT_REGISTRATION}>{STUDENT_REGISTRATION}</option>
            </select>

            {(isParentRegistration || isStudentRegistration) && (
              <>
                <div className="section-title">Parent Details</div>

                <input
                  name="parent_name"
                  placeholder="Parent Name"
                  value={form.parent_name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="parent_phone"
                  placeholder="Parent Phone Number"
                  value={form.parent_phone}
                  onChange={handleChange}
                  required
                />

                <input
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                />

                <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>

                <textarea
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                />
              </>
            )}

            {isStudentRegistration && (
              <>
                <div className="section-title">Student Details</div>

                <input
                  name="student_name"
                  placeholder="Student Name"
                  value={form.student_name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="age"
                  placeholder="Student Age"
                  value={form.age}
                  onChange={handleChange}
                  required
                />

                <input
                  name="class_grade"
                  placeholder="Class / Grade"
                  value={form.class_grade}
                  onChange={handleChange}
                  required
                />
              </>
            )}

            {(isParentRegistration || isStudentRegistration) && (
              <>
                <textarea
                  name="remarks"
                  placeholder="Remarks / Additional Details"
                  value={form.remarks}
                  onChange={handleChange}
                  rows="3"
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>Why Choose Swanthike Online Academy</h3>
            <ul>
              <li>Traditional and academic courses in one platform</li>
              <li>Supportive and value-based teaching approach</li>
              <li>Flexible online learning for children and parents</li>
              <li>Structured guidance with personal attention</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Available Courses</h3>
            <div className="course-list">
              {courseOptions.map((course) => (
                <span key={course} className="course-chip">
                  {course}
                </span>
              ))}
            </div>
          </div>

          <div className="info-card">
            <h3>Founder</h3>
            <p className="founder-name">Ranjitha Vinay</p>
            <p>
              Dedicated to building confident learners with academic strength,
              cultural values, and language excellence.
            </p>
          </div>

          <div className="info-card">
            <h3>Contact Us</h3>
            <p><strong>Academy:</strong> Swanthike Online Academy</p>
            <p><strong>WhatsApp:</strong> +91 9513044884</p>
            <p><strong>Email:</strong> ranjitha.vinay@swanthike.com</p>
            <p>
              <strong>Website:</strong>{" "}
              <a href="https://www.swanthike.com" target="_blank" rel="noreferrer">
                www.swanthike.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/919513044884"
        className="whatsapp-btn"
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp Us
      </a>

      <footer className="page-footer">
        <p>© 2026 Swanthike Online Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}