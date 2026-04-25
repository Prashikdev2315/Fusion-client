/**
 * UC-06: Manage Patient Records - Compounder Component
 * Features:
 * - Search patients
 * - View patient medical history
 * - Create new visit records
 * - Add prescriptions to visits
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { host } from '../../../../routes/globalRoutes';
import './ManagePatientRecords.css';

const ManagePatientRecords = () => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showCreateVisit, setShowCreateVisit] = useState(false);
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split('T')[0],
  });

  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    visit_id: '',
    doctor_id: '',
    diagnosis: '',
    notes: '',
    medicines: [{ medicine_id: '', dosage: '', duration: '', instructions: '' }],
  });

  // API endpoints - use host from globalRoutes
  const phcStaffBase = `${host}/phc/staff`;
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');

  // Search patients
  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${phcStaffBase}/patient/search/`, {
        params: { q: searchQuery },
        headers: { Authorization: `Token ${token}` },
      });

      if (response.data.success) {
        setSearchResults(response.data.data);
        setSuccess(`Found ${response.data.count} patient(s)`);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error searching patients: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Select patient and load records
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${phcStaffBase}/patient/${patient.id}/history/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (response.data.success) {
        setPatientRecords(response.data.data);
        setSuccess('Patient records loaded');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error loading patient records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new visit record
  const handleCreateVisit = async () => {
    if (!selectedPatient || !visitForm.visit_date) {
      setError('Please select a patient and visit date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${phcStaffBase}/visit/create/`,
        {
          patient_id: selectedPatient.id,
          visit_date: visitForm.visit_date,
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Visit record created successfully');
        setShowCreateVisit(false);
        // Reload patient records
        handleSelectPatient(selectedPatient);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error creating visit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add prescription to visit
  const handleAddPrescription = async () => {
    if (!prescriptionForm.visit_id || !prescriptionForm.doctor_id || !prescriptionForm.diagnosis) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${phcStaffBase}/visit/add-prescription/`,
        {
          visit_id: prescriptionForm.visit_id,
          doctor_id: prescriptionForm.doctor_id,
          diagnosis: prescriptionForm.diagnosis,
          notes: prescriptionForm.notes,
          medicines: prescriptionForm.medicines.filter(m => m.medicine_id),
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Prescription added successfully');
        setShowAddPrescription(false);
        // Reload patient records
        handleSelectPatient(selectedPatient);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error adding prescription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add medicine field
  const handleAddMedicineField = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [
        ...prescriptionForm.medicines,
        { medicine_id: '', dosage: '', duration: '', instructions: '' },
      ],
    });
  };

  // Remove medicine field
  const handleRemoveMedicineField = (index) => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: prescriptionForm.medicines.filter((_, i) => i !== index),
    });
  };

  // Update medicine field
  const handleUpdateMedicine = (index, field, value) => {
    const updatedMedicines = [...prescriptionForm.medicines];
    updatedMedicines[index][field] = value;
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: updatedMedicines,
    });
  };

  return (
    <div className="uc06-container">
      <h1>Manage Patient Records</h1>
      <p className="subtitle">Compounder: Search, view, and manage patient medical records</p>

      {/* Alert messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Search Section */}
      <div className="section search-section">
        <h2>Step 1: Search Patient</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter patient ID, name, or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchPatient()}
          />
          <button onClick={handleSearchPatient} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results ({searchResults.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.name || 'N/A'}</td>
                    <td>{patient.email || 'N/A'}</td>
                    <td>
                      <button
                        className="btn-select"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Records Section */}
      {selectedPatient && patientRecords && (
        <>
          <div className="section patient-info">
            <h2>Step 2: Patient Information</h2>
            <div className="patient-header">
              <div className="patient-details">
                <p>
                  <strong>Patient:</strong> {patientRecords.patient_name}
                </p>
                <p>
                  <strong>Email:</strong> {patientRecords.patient_email}
                </p>
                <p>
                  <strong>Total Visits:</strong> {patientRecords.total_visits}
                </p>
              </div>
              <button
                className="btn-action btn-primary"
                onClick={() => setShowCreateVisit(!showCreateVisit)}
              >
                {showCreateVisit ? 'Cancel' : '+ Create New Visit'}
              </button>
            </div>

            {/* Create Visit Form */}
            {showCreateVisit && (
              <div className="form-section">
                <h3>Create New Visit Record</h3>
                <div className="form-group">
                  <label>Visit Date:</label>
                  <input
                    type="date"
                    value={visitForm.visit_date}
                    onChange={(e) =>
                      setVisitForm({ ...visitForm, visit_date: e.target.value })
                    }
                  />
                </div>
                <button className="btn-action btn-success" onClick={handleCreateVisit}>
                  Create Visit
                </button>
              </div>
            )}
          </div>

          {/* Recent Visits */}
          <div className="section visits-section">
            <h2>Recent Visits</h2>
            {patientRecords.recent_visits && patientRecords.recent_visits.length > 0 ? (
              <div className="visits-list">
                {patientRecords.recent_visits.map((visit) => (
                  <div key={visit.visit_id} className="visit-card">
                    <div className="visit-header">
                      <strong>Visit ID: {visit.visit_id}</strong>
                      <span className={`status ${visit.status}`}>{visit.status}</span>
                    </div>
                    <p>
                      <strong>Date:</strong> {new Date(visit.date).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Doctor:</strong> {visit.doctor}
                    </p>
                    <p>
                      <strong>Diagnosis:</strong> {visit.diagnosis || 'N/A'}
                    </p>
                    <p>
                      <strong>Notes:</strong> {visit.notes || 'N/A'}
                    </p>

                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div className="prescriptions">
                        <strong>Prescriptions:</strong>
                        <ul>
                          {visit.prescriptions.map((rx, idx) => (
                            <li key={idx}>
                              {rx.medicine} - {rx.dosage} for {rx.duration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      className="btn-action btn-secondary"
                      onClick={() => {
                        setPrescriptionForm({
                          ...prescriptionForm,
                          visit_id: visit.visit_id,
                        });
                        setShowAddPrescription(true);
                      }}
                    >
                      Add Prescription
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No visits yet. Create a new visit record.</p>
            )}
          </div>

          {/* Add Prescription Form */}
          {showAddPrescription && (
            <div className="section form-section add-prescription">
              <h2>Step 3: Add Prescription to Visit</h2>
              <div className="form-group">
                <label>Doctor ID:</label>
                <input
                  type="number"
                  value={prescriptionForm.doctor_id}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      doctor_id: e.target.value,
                    })
                  }
                  placeholder="Enter doctor ID"
                />
              </div>

              <div className="form-group">
                <label>Diagnosis:</label>
                <textarea
                  value={prescriptionForm.diagnosis}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      diagnosis: e.target.value,
                    })
                  }
                  placeholder="Enter diagnosis"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={prescriptionForm.notes}
                  onChange={(e) =>
                    setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })
                  }
                  placeholder="Enter notes"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Medicines:</label>
                {prescriptionForm.medicines.map((medicine, idx) => (
                  <div key={idx} className="medicine-row">
                    <input
                      type="number"
                      placeholder="Medicine ID"
                      value={medicine.medicine_id}
                      onChange={(e) => handleUpdateMedicine(idx, 'medicine_id', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 1 tablet)"
                      value={medicine.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 5 days)"
                      value={medicine.duration}
                      onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Instructions"
                      value={medicine.instructions}
                      onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                    />
                    {prescriptionForm.medicines.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveMedicineField(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-action btn-secondary"
                  onClick={handleAddMedicineField}
                >
                  + Add Medicine
                </button>
              </div>

              <div className="form-actions">
                <button
                  className="btn-action btn-success"
                  onClick={handleAddPrescription}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Prescription'}
                </button>
                <button
                  className="btn-action btn-cancel"
                  onClick={() => setShowAddPrescription(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagePatientRecords;
