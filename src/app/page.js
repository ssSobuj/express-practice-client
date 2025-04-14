"use client";

import { useState } from "react";
import Link from "next/link";
import { useSwrFetcher } from "@/lib/useSwrFetcher"; // Assuming this hook is fixed to return mutate
import axios from "axios";

// Define the SWR key consistently
const USERS_API_ENDPOINT = "http://localhost:5000/api/users";

export default function UserManagement() {
  const {
    data: users = [], // SWR provides the user list
    error: fetchError,
    isLoading: isLoadingUsers,
    // We'll use the global mutate for simplicity and robustness here,
    // assuming useSwrFetcher might not consistently provide it.
    mutate, // This would come from useSwrFetcher if it returns it
  } = useSwrFetcher("/api/users"); // Use the consistent key

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState(null); // State for delete errors

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const formData = new FormData(e.target);
    const newUserInput = Object.fromEntries(formData.entries());

    // Prepare data (convert age to number if present and not empty)
    const dataToSend = {
      ...newUserInput,
      // Ensure age is number or undefined (don't send empty string if field is empty)
      age: newUserInput.age ? Number(newUserInput.age) : undefined,
    };
    // Remove age if it wasn't provided or resulted in NaN (though type="number" helps)
    if (dataToSend.age === undefined || isNaN(dataToSend.age)) {
      delete dataToSend.age;
    }

    try {
      // POST to the base /api/users endpoint
      const response = await axios.post(USERS_API_ENDPOINT, dataToSend);

      // Backend now returns { message, insertedId, userId, user }
      if (response.data && response.data.user) {
        console.log("User added, response data:", response.data);
        // Optimistically update the UI using global mutate
        mutate([...users, response.data.user], false);
      } else {
        console.warn("POST response format unexpected, revalidating list.");
      }

      e.target.reset(); // Reset form on success
    } catch (err) {
      console.error("Error adding user:", err);
      setFormError(
        err.response?.data?.message || "Failed to add user. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // *** Updated handleDelete to use userId ***
  const handleDelete = async (userIdToDelete) => {
    // Changed parameter name
    setDeleteError(null); // Clear previous delete errors
    if (!confirm("Are you sure you want to delete this user?")) return;

    console.log("Attempting to delete user with userId:", userIdToDelete);

    try {
      // DELETE request uses the userId in the URL now
      await axios.delete(`${USERS_API_ENDPOINT}/${userIdToDelete}`); // Use userIdToDelete in URL

      // Optimistically update the UI using global mutate
      mutate(
        users.filter((user) => user.userId !== userIdToDelete),
        false
      );

      console.log(
        `Successfully triggered deletion for userId: ${userIdToDelete}`
      );
    } catch (err) {
      console.error("Failed to delete user:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to delete user. Please try again.";
      setDeleteError(errorMsg); // Set delete-specific error
      alert(errorMsg); // Also alert user
    }
  };

  if (isLoadingUsers)
    return <div className="p-4 text-center">Loading users...</div>;
  // Display fetch error prominently if loading failed
  if (fetchError && !users.length) {
    return (
      <div className="p-4 text-center text-red-600">
        Error loading users: {fetchError.message || "Failed to fetch"}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* --- Add User Form --- */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New User</h2>
        {formError && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {formError}
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Input fields (name, email, age) remain the same */}
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
              type="number"
              name="age"
              id="age"
              placeholder="Enter user age"
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </div>

      {/* --- User List --- */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        {/* Display Delete Error */}
        {deleteError && (
          <p className="text-red-600 text-sm mb-3">Error: {deleteError}</p>
        )}
        {/* Display Fetch Error if list is empty */}
        {fetchError && users.length === 0 && (
          <p className="text-red-600 text-sm mb-3">
            Error loading users: {fetchError.message || "Failed to fetch"}
          </p>
        )}

        {users.length === 0 && !isLoadingUsers && !fetchError ? (
          <p className="text-gray-500">No users found. Add some!</p>
        ) : (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="text-sm flex-grow mr-4">
                  {" "}
                  {/* Display details */}
                  <span className="font-medium text-gray-900">
                    {user.userId} {/* Show sequential ID */}
                  </span>
                  <span className="text-gray-500 mx-2">|</span>
                  {/* Link still uses sequential ID */}
                  <Link
                    href={`/user/${user.userId}`}
                    className="font-semibold hover:text-indigo-600"
                  >
                    {user.name}
                  </Link>
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="text-gray-600 break-all">{user.email}</span>
                  {/* Display age only if it exists */}
                  {user.age !== undefined && user.age !== null && (
                    <>
                      <span className="text-gray-500 mx-2">|</span>
                      <span className="text-gray-600">Age: {user.age}</span>
                    </>
                  )}
                </div>
                {/* *** Updated onClick to pass user.userId to handleDelete *** */}
                <button
                  onClick={() => handleDelete(user.userId)} // Pass numeric userId here
                  className="ml-auto flex-shrink-0 py-1 px-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label={`Delete user ${user.name}`}
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
