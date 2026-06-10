// ===========================================================================
// AddOpportunityForm.jsx — the "post your own" form.
//
// This component keeps its OWN local state for the in-progress field values,
// because nothing else in the app needs to know what's half-typed. Only when
// the user submits does it hand the finished object UP to App via onAdd().
// ===========================================================================

import { useState } from "react";

function AddOpportunityForm({ onAdd }) {
  // All fields held in one object. Note startDate + endDate so an opportunity
  // can have a date RANGE, matching how the API represents dates.
  const [form, setForm] = useState({
    title: "",
    organization: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    category: "",
  });

  // One handler for every input. It reads the input's `name` attribute to know
  // WHICH field changed, using a computed property key [name] to update just
  // that one. We spread ...prev first so the other fields are preserved.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // On submit: stop the page reload, hand the data up to App, then reset.
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    setForm({
      title: "",
      organization: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
      category: "",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        maxLength={120}
        required
      />
      <input
        name="organization"
        value={form.organization}
        onChange={handleChange}
        placeholder="Organization"
        maxLength={120}
        required
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        maxLength={1000}
        required
      />
      <input
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="Location"
        maxLength={120}
        required
      />

      {/* Start and end dates sit side by side in one row. Each is wrapped in
          a <label> so its caption is clickable and screen-reader friendly
          (date inputs can't use placeholder text the way text inputs do). */}
      <div className="date-row">
        <label className="date-field">
          <span>Start date</span>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            required
          />
        </label>
        <label className="date-field">
          <span>End date</span>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <input
        name="category"
        value={form.category}
        onChange={handleChange}
        placeholder="Category"
        maxLength={60}
        required
      />
      <button type="submit">Add Opportunity</button>
    </form>
  );
}

export default AddOpportunityForm;
