import { useEffect, useMemo, useState } from "react";
import type { Appointment, Invoice, Patient } from "@medical-camp/shared";
import { api } from "../lib/api";

interface DraftInvoiceItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

const emptyItem = (): DraftInvoiceItem => ({
  description: "",
  quantity: "1",
  unitPrice: ""
});

export const BillingPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [items, setItems] = useState<DraftInvoiceItem[]>([emptyItem()]);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedItems = useMemo(
    () =>
      items
        .map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
        .filter(
          (item) =>
            item.description.length > 0 &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0 &&
            Number.isFinite(item.unitPrice) &&
            item.unitPrice > 0
        ),
    [items]
  );

  const loadDependencies = async (historyPatientId?: number) => {
    try {
      const [patientsResponse, appointmentsResponse, billingHistoryResponse] =
        await Promise.all([
          api.getPatients(false),
          api.getAppointments(),
          api.getBillingHistory(historyPatientId)
        ]);

      setPatients(patientsResponse.patients);
      setAppointments(appointmentsResponse.appointments);
      setInvoices(billingHistoryResponse.invoices);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load billing data");
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  const updateItem = (index: number, key: keyof DraftInvoiceItem, value: string) => {
    setItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems((previous) => [...previous, emptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleCalculate = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (normalizedItems.length === 0) {
      setErrorMessage("Add at least one valid invoice item first.");
      return;
    }

    try {
      const response = await api.calculateBilling({ items: normalizedItems });
      setCalculatedTotal(response.totalCost);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to calculate total");
    }
  };

  const handleGenerateInvoice = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!patientId) {
      setErrorMessage("Select a patient to generate an invoice.");
      return;
    }

    if (normalizedItems.length === 0) {
      setErrorMessage("Add at least one valid invoice item first.");
      return;
    }

    try {
      await api.generateInvoice({
        patientId: Number(patientId),
        appointmentId: appointmentId ? Number(appointmentId) : undefined,
        items: normalizedItems
      });

      setSuccessMessage("Invoice generated successfully.");
      setItems([emptyItem()]);
      setAppointmentId("");
      setCalculatedTotal(null);
      await loadDependencies(patientId ? Number(patientId) : undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate invoice");
    }
  };

  const handleProcessPayment = async (invoice: Invoice) => {
    const paymentMethod = window.prompt("Payment method", invoice.paymentMethod ?? "Cash");

    if (!paymentMethod) {
      return;
    }

    try {
      await api.processPayment(invoice.id, { paymentMethod });
      setSuccessMessage("Payment processed successfully.");
      await loadDependencies(patientId ? Number(patientId) : undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to process payment");
    }
  };

  const handleViewHistory = async () => {
    await loadDependencies(patientId ? Number(patientId) : undefined);
  };

  return (
    <section>
      <h2>Billing System</h2>
      <p>Calculate totals, generate invoices, process payments, and view billing history.</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="form-grid">
        <label htmlFor="billingPatient">
          Patient
          <select
            id="billingPatient"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="billingAppointment">
          Appointment (Optional)
          <select
            id="billingAppointment"
            value={appointmentId}
            onChange={(event) => setAppointmentId(event.target.value)}
          >
            <option value="">No appointment</option>
            {appointments
              .filter((appointment) =>
                patientId ? appointment.patientId === Number(patientId) : true
              )
              .map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  #{appointment.id} - {new Date(appointment.scheduledAt).toLocaleString()}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="detail-panel">
        <h3>Invoice Items</h3>
        {items.map((item, index) => (
          <div className="line-item-row" key={`item-${index}`}>
            <input
              placeholder="Description"
              value={item.description}
              onChange={(event) => updateItem(index, "description", event.target.value)}
            />
            <input
              placeholder="Qty"
              inputMode="numeric"
              value={item.quantity}
              onChange={(event) => updateItem(index, "quantity", event.target.value)}
            />
            <input
              placeholder="Unit Price"
              inputMode="decimal"
              value={item.unitPrice}
              onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="inline-actions">
          <button className="btn btn-secondary" type="button" onClick={addItem}>
            Add Item
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleCalculate}>
            Calculate Total
          </button>
          <button className="btn btn-primary" type="button" onClick={handleGenerateInvoice}>
            Generate Invoice
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleViewHistory}>
            View Billing History
          </button>
        </div>

        {calculatedTotal !== null && (
          <p>
            Calculated Total: <strong>{calculatedTotal.toFixed(2)}</strong>
          </p>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>#{invoice.id}</td>
                <td>{invoice.patientName ?? invoice.patientId}</td>
                <td>{invoice.status}</td>
                <td>{invoice.totalCost.toFixed(2)}</td>
                <td>{invoice.paymentMethod ?? "-"}</td>
                <td>{invoice.items.length}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleProcessPayment(invoice)}
                    disabled={invoice.status === "PAID"}
                  >
                    Process Payment
                  </button>
                </td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td colSpan={7}>No billing records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
