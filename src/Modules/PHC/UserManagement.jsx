import React, { useMemo, useState } from "react";
import { createPhcUser, getPhcUsersByRole } from "./api";
import PHCNav from "./components/PHCNav";

const roleOptions = ["student", "professor", "phc_staff", "accounts", "authority"];

const initialForm = {
  role: "student",
  email: "",
  password: "",
  username: "",
  first_name: "",
  last_name: "",
  registration_id: "",
  roll_number: "",
  course: "",
  year: "",
  employee_id: "",
  designation: "",
  approval_level: "",
};

function UserManagement() {
  const [form, setForm] = useState(initialForm);
  const [filterRole, setFilterRole] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requiredHints = useMemo(() => {
    if (form.role === "student") {
      return "Required: role, email, password, registration_id or roll_number";
    }
    if (form.role === "professor" || form.role === "phc_staff") {
      return "Required: role, email, password, employee_id, designation";
    }
    if (form.role === "accounts") {
      return "Required: role, email, password, employee_id";
    }
    return "Required: role, email, password, employee_id, approval_level";
  }, [form.role]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoadingCreate(true);

    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
      };

      const response = await createPhcUser(payload);
      setSuccess(response?.message || "User created successfully");
      setForm((prev) => ({
        ...initialForm,
        role: prev.role,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create user");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleList = async () => {
    setError("");
    setSuccess("");
    setLoadingList(true);

    try {
      const response = await getPhcUsersByRole(filterRole || undefined);
      setUsers(response?.data || []);
    } catch (err) {
      setUsers([]);
      setError(err?.response?.data?.message || "Unable to fetch users");
    } finally {
      setLoadingList(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <h2>PHC User Management</h2>
      <p>Create PHC users with role-specific profile data and verify by role filter.</p>

      <form onSubmit={handleCreate} style={{ display: "grid", gap: 8, maxWidth: 760 }}>
        <label>
          Role
          <select value={form.role} onChange={(e) => updateField("role", e.target.value)}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
          />
        </label>

        <label>
          Username (optional)
          <input value={form.username} onChange={(e) => updateField("username", e.target.value)} />
        </label>

        <label>
          First Name (optional)
          <input value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} />
        </label>

        <label>
          Last Name (optional)
          <input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} />
        </label>

        {form.role === "student" ? (
          <>
            <label>
              Registration ID
              <input
                value={form.registration_id}
                onChange={(e) => updateField("registration_id", e.target.value)}
              />
            </label>

            <label>
              Roll Number (alternative)
              <input value={form.roll_number} onChange={(e) => updateField("roll_number", e.target.value)} />
            </label>

            <label>
              Course (optional)
              <input value={form.course} onChange={(e) => updateField("course", e.target.value)} />
            </label>

            <label>
              Year (optional)
              <input
                type="number"
                min="1"
                max="8"
                value={form.year}
                onChange={(e) => updateField("year", e.target.value)}
              />
            </label>
          </>
        ) : null}

        {form.role !== "student" ? (
          <>
            <label>
              Employee ID
              <input value={form.employee_id} onChange={(e) => updateField("employee_id", e.target.value)} />
            </label>

            {form.role === "professor" || form.role === "phc_staff" ? (
              <label>
                Designation
                <input value={form.designation} onChange={(e) => updateField("designation", e.target.value)} />
              </label>
            ) : null}

            {form.role === "authority" ? (
              <label>
                Approval Level
                <input
                  value={form.approval_level}
                  onChange={(e) => updateField("approval_level", e.target.value)}
                />
              </label>
            ) : null}
          </>
        ) : null}

        <small>{requiredHints}</small>
        <button type="submit" disabled={loadingCreate}>
          {loadingCreate ? "Creating..." : "Create User"}
        </button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Filter by role
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">all</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleList} disabled={loadingList}>
          {loadingList ? "Loading..." : "Get Users"}
        </button>
      </div>

      {success ? <p style={{ color: "green" }}>{success}</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <pre style={{ background: "#f5f5f5", padding: 12, overflowX: "auto" }}>
        {JSON.stringify(users, null, 2)}
      </pre>
    </div>
  );
}

export default UserManagement;
