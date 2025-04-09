"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Home() {
  const [users, setUsers] = useState([]);

  // Fetch initial users
  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []); // Empty dependency array means this runs once on mount

  // Handle form submission (POST request)
  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newUserInput = Object.fromEntries(formData.entries());
    console.log(newUserInput);

    fetch("http://localhost:5000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUserInput),
    })
      .then((response) => {
        if (!response.ok) {
          // Attempt to read error message from backend if available
          return response
            .json()
            .then((errData) => {
              throw new Error(
                errData.message || `HTTP error! status: ${response.status}`
              );
            })
            .catch(() => {
              // Fallback if reading error json fails
              throw new Error(`HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
      })
      .then((result) => {
        // --- IMPORTANT ---
        // The backend currently returns { insertedId, message, userId }.
        // To properly update state, we should include the original input data
        // and the returned IDs.
        const newUserWithIds = {
          ...newUserInput, // name, email from input
          _id: result.insertedId, // MongoDB ObjectId from backend
          userId: result.userId, // Sequential ID from backend
          // Note: createdAt is only on the backend unless returned
        };
        setUsers([...users, newUserWithIds]); // Add the more complete user object to state
        event.target.reset(); // Clear the form fields
      })
      .catch((error) => {
        console.error("Error adding user:", error);
        alert(`Error adding user: ${error.message}`); // Show error to user
      });
  };

  // --- Handle Delete ---
  const handleDelete = (idToDelete) => {
    // Optional: Add a confirmation dialog
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return; // Stop if the user cancels
    }

    console.log("Attempting to delete user with _id:", idToDelete);

    fetch(`http://localhost:5000/users/${idToDelete}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          // Attempt to read error message from backend
          return response
            .json()
            .then((errData) => {
              throw new Error(
                errData.message || `HTTP error! status: ${response.status}`
              );
            })
            .catch(() => {
              throw new Error(`HTTP error! status: ${response.status}`);
            });
        }
        // Check if response has content before trying to parse JSON
        // DELETE often returns 204 No Content, which has no body
        if (response.status === 204) {
          return { message: "Delete successful (No Content)" }; // Simulate backend message if needed
        }
        return response.json(); // Parse JSON if there is a body (like our backend sends)
      })
      .then((result) => {
        console.log("Delete Success:", result);
        // Update the state by filtering out the deleted user
        setUsers(users.filter((user) => user._id !== idToDelete));
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
        alert(`Error deleting user: ${error.message}`); // Show error to user
      });
  };
  // --- End Handle Delete ---

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">
        User Management CRUD
      </h1>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New User</h2>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter user name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter user email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700"
            >
              Age <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="age"
              name="age"
              id="age"
              placeholder="enter user age"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add User
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">No users found. Add some!</p>
        ) : (
          <ul className="space-y-3">
            {users?.map((user) => (
              <li
                key={user?._id} // Use MongoDB _id for the key
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {user?.userId} {/* Display sequential ID */}
                  </span>
                  <span className="text-gray-500 mx-2">|</span>
                  <Link
                    href={`/user/${user?.userId}`}
                    className="font-semibold"
                  >
                    {user?.name}
                  </Link>
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="text-gray-600">{user?.email}</span>{" "}
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="text-gray-600">{user?.age || 18}</span>
                  {/* Optional: Display MongoDB _id for debugging */}
                  {/* <span className="text-gray-400 text-xs ml-4">({user?._id})</span> */}
                </div>
                <button
                  onClick={() => handleDelete(user._id)} // Pass the MongoDB _id
                  className="ml-4 py-1 px-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
