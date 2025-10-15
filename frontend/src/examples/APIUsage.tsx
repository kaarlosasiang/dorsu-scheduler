// Example usage of the API services

// 1. Using the API directly
import { AuthAPI, FacultyAPI } from "@/lib/services";

// Login example
const handleLogin = async () => {
  try {
    const response = await AuthAPI.login({
      username: "admin",
      password: "password123"
    });
    console.log("Login successful:", response);
  } catch (error) {
    console.error("Login failed:", error);
  }
};

// Faculty operations example
const handleFacultyOperations = async () => {
  try {
    // Get all faculty
    const facultyList = await FacultyAPI.getAll();
    console.log("Faculty list:", facultyList);

    // Create new faculty
    const newFaculty = await FacultyAPI.create({
      name: "Dr. John Smith",
      department: "Computer Science",
      availability: [
        {
          day: "Monday",
          startTime: "08:00",
          endTime: "17:00"
        }
      ]
    });
    console.log("Created faculty:", newFaculty);

    // Get faculty stats
    const stats = await FacultyAPI.getStats("Computer Science");
    console.log("Faculty stats:", stats);
  } catch (error) {
    console.error("Faculty operation failed:", error);
  }
};

// 2. Using the custom hooks
import { useAuth, useFaculty } from "@/lib/hooks/useAPI";

const ExampleComponent = () => {
  const auth = useAuth();
  const faculty = useFaculty();

  const handleLogin = async () => {
    await auth.login({
      username: "admin",
      password: "password123"
    });
  };

  const loadFaculty = async () => {
    await faculty.getAll({ status: "active" });
  };

  const createFaculty = async () => {
    await faculty.create({
      name: "Dr. Jane Doe",
      department: "Mathematics",
    });
  };

  return (
    <div>
      <button 
        onClick={handleLogin} 
        disabled={auth.loading}
      >
        {auth.loading ? "Logging in..." : "Login"}
      </button>

      <button 
        onClick={loadFaculty} 
        disabled={faculty.loading}
      >
        {faculty.loading ? "Loading..." : "Load Faculty"}
      </button>

      <button 
        onClick={createFaculty} 
        disabled={faculty.loading}
      >
        {faculty.loading ? "Creating..." : "Create Faculty"}
      </button>

      {faculty.data && (
        <div>
          <h3>Faculty List:</h3>
          <pre>{JSON.stringify(faculty.data, null, 2)}</pre>
        </div>
      )}

      {faculty.error && (
        <div style={{ color: "red" }}>
          Error: {faculty.error}
        </div>
      )}
    </div>
  );
};

export default ExampleComponent;