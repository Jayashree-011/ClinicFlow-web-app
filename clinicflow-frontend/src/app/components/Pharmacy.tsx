import { useState } from "react";

export function Pharmacy() {
  const role = localStorage.getItem("role");

  const [inventory] = useState([
    { id: 1, name: "Paracetamol", quantity: 50 },
    { id: 2, name: "Ibuprofen", quantity: 30 },
  ]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Pharmacy Module</h2>

      {/* ✅ ROLE BASED ACTIONS */}
      {role === "ADMIN" && (
        <button className="bg-green-600 text-white px-4 py-2 rounded mb-4 mr-2">
          Add Medicine
        </button>
      )}

      {role === "DOCTOR" && (
        <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
          Request Medicine
        </button>
      )}

      <div className="bg-white p-4 rounded shadow">
        {inventory.map((item) => (
          <div key={item.id} className="border-b py-2">
            {item.name} — Stock: {item.quantity}
          </div>
        ))}
      </div>
    </div>
  );
}
