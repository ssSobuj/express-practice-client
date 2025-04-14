"use client"; // Required for useState, useEffect

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // Correct hook for App Router Client Components

function UserDetailPage() {
  // --- State Variables ---
  const [user, setUser] = useState(null); // Holds the fetched user data
  const [formData, setFormData] = useState({ name: "", email: "", age: "" }); // Holds data being edited in the form
  const [isEditing, setIsEditing] = useState(false); // Controls form visibility
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial fetch
  const [isUpdating, setIsUpdating] = useState(false); // Loading state for update operation
  const [error, setError] = useState(null); // Stores fetch or update errors
  const [updateSuccess, setUpdateSuccess] = useState(false); // Flag for success message

  // --- Get Route Parameters ---
  // Use useParams hook in Client Components within App Router
  const params = useParams();
  const id = params?.id; // Get the user ID from the URL (e.g., /user/123)

  // --- Effect for Initial Data Fetch ---
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError("User ID not found in URL.");
      return; // Don't fetch if ID is missing
    }

    setIsLoading(true);
    setError(null); // Reset error
    setUpdateSuccess(false); // Reset success message

    fetch(`http://localhost:5000/api/users/${id}`) // Use the correct API endpoint (_id)
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`User not found (ID: ${id})`);
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        // IMPORTANT: Initialize form data *after* user data is fetched
        setFormData({
          name: data.name || "",
          email: data.email || "",
          // Ensure age is treated consistently (string for form input)
          age:
            data.age !== undefined && data.age !== null ? String(data.age) : "",
        });
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        setError(error.message);
        setIsLoading(false);
      });
  }, [id]); // Re-run effect if the ID changes

  // --- Event Handlers ---
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setUpdateSuccess(false); // Hide success message when toggling edit mode
    setError(null); // Clear previous update errors
    // Optionally reset form to current user data if cancelling
    if (isEditing && user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        age:
          user.age !== undefined && user.age !== null ? String(user.age) : "",
      });
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setIsUpdating(true);
    setError(null);
    setUpdateSuccess(false);

    // Prepare data: ensure age is a number if needed by backend
    const dataToSend = {
      ...formData,
      // Convert age back to number if it's not an empty string
      age: formData.age !== "" ? Number(formData.age) : undefined, // Send undefined if empty, or handle as needed by API
    };
    // Remove undefined age if API doesn't like it
    if (dataToSend.age === undefined) {
      delete dataToSend.age;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        // Use PATCH for partial updates
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const updatedUser = await response.json(); // Assuming API returns updated user or success message

      // Update local user state with the response (might just be a success message)
      // It's often better to re-fetch or update based on the dataToSend if API doesn't return full user
      setUser((prevUser) => ({
        ...prevUser,
        ...dataToSend,
        age: Number(dataToSend.age),
      })); // Optimistic update shown

      setUpdateSuccess(true); // Show success
      setIsEditing(false); // Close form on success
    } catch (error) {
      console.error("Error updating user:", error);
      setError(error.message);
    } finally {
      setIsUpdating(false); // Stop loading indicator
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="p-4 text-center">Loading user data...</div>;
  }

  if (error && !user) {
    // Show error only if user couldn't be loaded at all
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  if (!user) {
    // This case might be hit if ID was invalid or fetch resolved without error but no data
    return <div className="p-4 text-center">User not found.</div>;
  }

  // --- Main Component Return ---
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">User Details</h1>

      {/* --- User Data Display --- */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 border border-gray-200">
        <div className="mb-3">
          <strong className="block text-gray-700 text-sm font-bold mb-1">
            Name:
          </strong>
          <span className="text-gray-800 text-lg">{user.name}</span>
        </div>
        <div className="mb-3">
          <strong className="block text-gray-700 text-sm font-bold mb-1">
            Email:
          </strong>
          <span className="text-gray-800 text-lg">{user.email}</span>
        </div>
        <div className="mb-3">
          <strong className="block text-gray-700 text-sm font-bold mb-1">
            Age:
          </strong>
          <span className="text-gray-800 text-lg">{user.age ?? "N/A"}</span>
        </div>
        <div className="mb-3">
          <strong className="block text-gray-700 text-sm font-bold mb-1">
            User ID (DB):
          </strong>
          <span className="text-gray-500 text-sm">{user._id}</span>
        </div>
        <div className="mb-3">
          <strong className="block text-gray-700 text-sm font-bold mb-1">
            Sequential ID:
          </strong>
          <span className="text-gray-500 text-sm">{user.userId}</span>
        </div>
        <div className="mt-5">
          <button
            onClick={toggleEditMode}
            className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isEditing
                ? "bg-gray-500 hover:bg-gray-700 text-white"
                : "bg-blue-500 hover:bg-blue-700 text-white"
            }`}
          >
            {isEditing ? "Cancel Update" : "Update User"}
          </button>
        </div>
      </div>

      {/* --- Update Success/Error Messages --- */}
      {updateSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-300 rounded">
          User updated successfully!
        </div>
      )}
      {error &&
        isEditing && ( // Show update-specific errors only when form is open
          <div className="mb-4 p-3 bg-red-100 text-red-800 border border-red-300 rounded">
            Error updating: {error}
          </div>
        )}

      {/* --- Update Form (Conditional Rendering) --- */}
      {isEditing && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Edit User Information</h2>
          <form onSubmit={handleUpdateSubmit}>
            {/* Name Input */}
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required // Add basic HTML5 validation
              />
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="user@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Age Input */}
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="age"
              >
                Age
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="age"
                type="number" // Use type="number" for better UX on mobile
                placeholder="Age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="0" // Example validation
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="submit"
                disabled={isUpdating} // Disable button while submitting
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button" // Important: type="button" to prevent form submission
                onClick={toggleEditMode} // Re-use toggle to cancel
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default UserDetailPage;
