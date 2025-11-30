import { useEffect, useState, useRef } from "react";
import "./App.css";
import {
  Button,
  EditableText,
  InputGroup,
  OverlayToaster,
  Position,
  Dialog,
  Classes,
} from "@blueprintjs/core";
// db file name category_update_delete_add.py
function App() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [dialogMsg, setDialogMsg] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toaster = useRef(null);

  // Setup toaster
  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    toaster.current = OverlayToaster.create({ position: Position.TOP }, { container: div });
  }, []);

  // Show popup or toast
  const showPopup = (msg) => { setDialogMsg(msg); setIsDialogOpen(true); };
  const showToast = (msg, type = "primary") => toaster.current?.show({ message: msg, intent: type });

  // Fetch all categories
  const fetchData = () => {
    fetch("http://localhost:8000/get_categories")
      .then(res => res.json())
      .then(setCategories)
      .catch(() => showToast("Failed to fetch", "danger"));
  };

  useEffect(fetchData, []);

  // Add category
  const addCategory = () => {
    if (!newName.trim()) return showToast("Enter a name", "warning");
    fetch("http://localhost:8000/add_category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    })
      .then(res => res.json())
      .then(() => {
        showPopup("Category Added!");
        setNewName("");
        fetchData();
      })
      .catch(() => showToast("Add failed", "danger"));
  };

  // Update category
  const updateCategory = (id, name) => {
    fetch(`http://localhost:8000/update_category/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then(res => res.json())
      .then(() => showPopup("Category Updated!"))
      .catch(() => showToast("Update failed", "danger"));
  };

  // Delete category
  const deleteCategory = (id) => {
    fetch(`http://localhost:8000/delete_category/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        showPopup("Category Deleted!");
        fetchData();
      })
      .catch(() => showToast("Delete failed", "danger"));
  };

  // Edit handler
  const handleEdit = (id, name) => {
    setCategories(categories.map(c => c._id === id ? { ...c, name } : c));
  };

  return (
    <div className="App">
      <h2>Category List</h2>
      <table className="bp4-html-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
        </thead>
      <tbody>
          {categories.map(c => (
            <tr key={c._id}>
              <td><code>{c._id}</code></td>
              <td>
                <EditableText value={c.name} onChange={(v) => handleEdit(c._id, v)} />
              </td>
              <td>
                <Button intent="primary" onClick={() => updateCategory(c._id, c.name)}>Update</Button>{" "}
                <Button intent="danger" onClick={() => deleteCategory(c._id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
        <tr>
            <td><strong>New</strong></td>
            <td>
              <InputGroup
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name"
              />
            </td>
            <td>
              <Button intent="success" onClick={addCategory}>Add</Button>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Dialog */}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Message">
        <div className={Classes.DIALOG_BODY}>{dialogMsg}</div>
        <div className={Classes.DIALOG_FOOTER}>
          <Button intent="success" onClick={() => setIsDialogOpen(false)}>OK</Button>
        </div>
      </Dialog>
    </div>
  );
}

export default App;
