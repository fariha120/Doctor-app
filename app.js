import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
//   import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import {
  signInWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
//   import { initializeApp } from "firebase/app";
//import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "./config.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const pageRoles = {
  "/users.html": ["admin"],
  "/DoctorSearch.html": ["admin", "user"],
  "/doctor.html": ["admin", "doctor"],
  "/profile.html": ["admin", "doctor", "user"],
};

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getUserRoles(id) {
  const userDocRef = doc(db, "users", id);
  const docSnapshot = await getDoc(userDocRef);
  return docSnapshot.exists() ? docSnapshot.data().role : [];
}

async function checkAuthorization(path, userId) {
  
    const roles = await getUserRoles(userId);
    const requiredRoles = pageRoles[path] || [];

    if (requiredRoles.some((role) => roles.includes(role))) {
        console.log("Access granted");
        return true; // Authorized
    } else {
        console.error("Access denied");
        window.location.replace("/unauthorized");
        return false; // Unauthorized
    }
  
}

window.addEventListener("load", async () => {
  const currentPath = window.location.pathname;

  const storedUser = localStorage.getItem("user");
  const user = JSON.parse(storedUser);

  if (user) {
    const isAuthorized = await checkAuthorization(currentPath, user.id);
    if (!isAuthorized) {
        console.error("Redirecting to unauthorized page");
        window.history.back();
        return;
    }
  }

});


document.getElementById("logout-btn")?.addEventListener("click", logoutUser);

function logoutUser() {
  
  const answer = confirm("Are you sure you want to logout!");
  if(answer) {
    signOut(auth)
      .then(() => {
        
        console.log("User logged out successfully");
        // You can redirect the user to another page, for example:
        localStorage.clear();
        
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  }
}

if (window.location.pathname == "/profile.html") {

  const userId = localStorage.getItem("userId");

  if (userId) {
    console.log("Retrieved userId from localStorage:", userId);
    getUsernameByUserId(userId)
  } else {
    console.log("No userId found in localStorage");
  }


  // Function to get username by userId
async function getUsernameByUserId(userId) {
  try {
    // Reference to the user's document in the 'users' collection
    const userDocRef = doc(db, "users", userId);

    // Fetch the user document from Firestore
    const docSnapshot = await getDoc(userDocRef);

    if (docSnapshot.exists()) {
      // If the document exists, retrieve the 'username' field
      const name = docSnapshot.data().name;
      console.log("name retrieved:", name);
      document.getElementById("name").value =  name;
    }
  } catch (error) {
    console.error("Error fetching username:", error);
  }
}


  


// Toggle Dropdown on Click
document.getElementById("updateProfileButton").addEventListener("click", () => {
  alert("updated clicked");
  updateUserName(userId, document.getElementById("name").value);
});

async function updateUserName(userId, newName) {
  try {
    // Reference to the user's document in the 'users' collection
    const userDocRef = doc(db, "users", userId);

    // Update the 'name' field
    await updateDoc(userDocRef, {
      name: newName,
    });

    console.log("User name updated successfully!");
  } catch (error) {
    console.error("Error updating user name: ", error);
  }
}

}



if (window.location.pathname == "/login.html") {
  const googleLoginBtn = document.getElementById("google-login-btn");
  // Google Login
  googleLoginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      window.location.pathname = "./DoctorSearch.html";
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  });
}

// Add event listeners to the role selection radio buttons
document.querySelectorAll('input[name="role"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    const selectedRole = event.target.value; 
    const doctorFields = document.getElementById("doctor-fields");

    if (selectedRole === "doctor") {
      doctorFields.classList.remove("hidden"); // Show doctor-specific fields
    } else {
      doctorFields.classList.add("hidden"); // Hide doctor-specific fields
    }
  });
});

async function register() {
  const email = document.getElementById("exampleInputEmail1").value;
  const password = document.getElementById("exampleInputPassword1").value;
  const name = document.getElementById("name").value;
  const role = document.querySelector("input[name='role']:checked")?.value;
  // const role = document.getElementById("role").value; // Dropdown or radio button for role selectio

  // Check if both fields are filled
  if (email === "" || password === "") {
    alert("Please fill out both email and password fields.");
    return;
  }

  // Optional: Add more password validation (e.g., length, special characters)
  if (password.length < 6) {
    alert("Password should be at least 6 characters long.");
    return;
  }

  if (!role) {
    alert("Please select a role.");
    return;
  }

  // const spinner = document.createElement('div');
  // spinner.classList.add('spinner');

  //  registerButton.innerHTML = '';  // Clear the text
  //  registerButton.appendChild(spinner);  // Add the spinner to the button
  //  registerButton = true;  // Disable the button during processing

  //   // Simulate processing (e.g., submit a form or make an API call)
  //     setTimeout(() => {
  //       // Re-enable the button and reset its content after processing
  //       registerButton.disabled = false;
  //       registerButton.innerHTML = 'Register';
  //     }, 3000); // 3-second delay for demonstration
  //   }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // User registered successfully
    const user = userCredential.user;
    console.log("User registered:", user);

    // Save user data in Firestore
    await writeData(name, email, role);
    console.log("User stored in database.");

    alert("Registration successful! Welcome, " + user.email);
    // Redirect to sign-in page or dashboard
    window.location.pathname = "login.html";
  } catch (error) {
    console.error("Error signing up:", error.code, error.message);
    alert("Error: " + error.message);
  }
}

// Function to write data to Firestore
async function writeData(name, email, role) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      name,
      email,
      role,
    });
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document:", error);
  }
}

// Add event listener to the register button
document.getElementById("registerButton")?.addEventListener("click", register);

//   createUserWithEmailAndPassword(auth, email, password)
//     .then(async(userCredential) => {
//       // User register successfully
//       const user = userCredential.user;
//       console.log("User register:", user);

//       // save user data in firestore
//       if(role=="user"){
//         await writeData(name,email,role);
//       }
//       if(role=="doctor"){
//         await writeData(name,email,role);
//       }

//       console.log("user stored in database.")

//       alert(" successful! Welcome, " + user.email);
//       // Redirect to sign-in page or dashboard
//       window.location.pathname = "login.html";
//     })
//     .catch((error) => {
//       console.error("Error signing up:", error.code, error.message);
//       alert("Error: " + error.message);
//     });
// }

//     // Function to write data to Firestore
//     async function writeData(name, email, role) {
//       try {
//         const docRef = await addDoc(collection(db, "users"), {
//           name,
//           email,
//           role,
//         });
//         console.log("Document written with ID:", docRef.id);
//       } catch (error) {
//         console.error("Error adding document:", error);
//       }
//     }

// document.getElementById("registerButton")?.addEventListener("click", register);
// ------------
// Function to fetch all users
async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Function to fetch a user by email
async function getUserByEmail(email) {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    const user = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))[0];
    console.log("Fetched user:", user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userId", user.id);
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}


if (window.location.pathname == "/users.html") {
  // Function to show all users in a table
  async function showUsers() {
    const users = await getAllUsers();
    console.log("All users:", users);

    // Render users as a table
    const list = document.getElementById("users-list");
    if (list) {
      list.innerHTML = `
    <h1>List of Users</h1>
      <table border="1" cellspacing="0" cellpadding="5"  id="userTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (user) => `
            <tr>
              <td>${user.id}</td>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.role}</td>
              <td><button class="delete-btn"  data-id="${user.id}">Delete</button></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    document.getElementById("userTable").addEventListener("click", (event) => {
      if (event.target.classList.contains("delete-btn")) {
          const userId = event.target.getAttribute("data-id");
          if (confirm(`Delete user with ID: ${userId}?`)) {
              console.log(`Deleting user: ${userId}`);
              deleteUser(userId);
          }
      }
    });
    
    
    // Function to delete a user
    async function deleteUser(userId) {
      try {
          const userDocRef = doc(db, "users", userId); // Reference to the user document
          await deleteDoc(userDocRef); // Delete the document
          console.log(`User with ID ${userId} deleted successfully.`);
          alert("User successfully deleted");
          location.reload();
      } catch (error) {
          console.error("Error deleting user:", error);
      }
    }

    } else {
      console.error("Element with ID 'users-list' not found.");
    }
  }

  // Call showUsers to fetch and display users
  showUsers();


}

// Login function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill out both email and password fields.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("Signed in successfully:", user);

    // Fetch additional user data
    const userData = await getUserByEmail(email);
    console.log("Fetched user data:", userData);


    if (userData.is_admin) {
      alert("Admin User Logged In");
      window.location.pathname = "./users.html";
      return;
    }

    if (userData.role === "doctor") {
      window.location.pathname = "./doctor.html";
    } else {
      window.location.pathname = "./DoctorSearch.html";
    }


    // Save to session storage and redirect
    sessionStorage.setItem("user", JSON.stringify(userData));
    alert("Logged in successfully!");
    // window.location.pathname = "./.html";
  } catch (error) {
    console.error("Login error:", error.message);
    alert("Error: " + error.message);
  }
}

// document.querySelectorAll(".delete-btn").forEach((button) => {
//   button.addEventListener("click", () => {
//       const userId = button.getAttribute("data-id"); // Get the user ID from data attribute
//       if (confirm("Are you sure you want to delete this user?")) {
//           deleteUser(userId); // Call the deleteUser function
//       }
//   });
// });




// Attach event listener to login button
document.getElementById("loginButton")?.addEventListener("click", login);

// Function to delete documents where the 'role' field does not exist
async function deleteDocumentsWithoutRole() {
  try {
    const collectionRef = collection(db, "users"); // Replace "users" with your collection name
    const querySnapshot = await getDocs(collectionRef);

    let deletedCount = 0;

    querySnapshot.forEach(async (docSnapshot) => {
      // Check if 'role' field does not exist in the document
      if (!docSnapshot.data().hasOwnProperty("role")) {
        // Delete the document
        //await deleteDoc(doc(db, "users", docSnapshot.id));
        console.log(`Deleted document with ID: ${docSnapshot.id}`);
        deletedCount++;
      }
    });

    console.log(
      `${deletedCount} documents without a 'role' field were deleted.`
    );
  } catch (error) {
    console.error("Error deleting documents:", error);
  }
}

// Call the function to delete documents
// deleteDocumentsWithoutRole();

// --------------------


// Sample doctor data
const doctors = [
  {
    name: "Dr. Jane Doe",
    specialization: "Cardiologist",
    experience: 10,
    rating: 4.8,
    photo: "doctor1.jpg",
  },
  {
    name: "Dr. John Smith",
    specialization: "Dermatologist",
    experience: 15,
    rating: 4.9,
    photo: "doctor2.jpg",
  },
];

// Function to render doctors
function renderDoctors(filteredDoctors) {
  const doctorCards = document.getElementById("doctorCards");
  doctorCards.innerHTML = ""; // Clear previous content

  if (filteredDoctors.length === 0) {
    doctorCards.innerHTML = "<p>No doctors found.</p>";
    return;
  }

  filteredDoctors.forEach((doctor) => {
    const card = document.createElement("div");
    card.className = "doctor-card";
    card.innerHTML = `
      <img src="${doctor.photo}" alt="${doctor.name}" class="doctor-photo" />
      <div class="doctor-info">
        <h3>${doctor.name}</h3>
        <p>${doctor.specialization}</p>
        <p>${doctor.experience} Years Experience</p>
        <p class="rating">⭐ ${doctor.rating}</p>
        <button>View Profile</button>
      </div>
    `;
    doctorCards.appendChild(card);
  });
}

// Filter doctors based on search and filters
function filterDoctors() {
  const search = document.getElementById("searchBar").value.toLowerCase();
  const specialization = document.getElementById("specialization").value;
  const experience = parseInt(document.getElementById("experience").value) || 0;
  const ratings = parseFloat(document.getElementById("ratings").value) || 0;

  const filtered = doctors.filter((doctor) => {
    return (
      doctor.name.toLowerCase().includes(search) &&
      (specialization === "" || doctor.specialization === specialization) &&
      doctor.experience >= experience &&
      doctor.rating >= ratings
    );
  });

  renderDoctors(filtered);
}

if (window.location.pathname == "/DoctorSearch.html" || window.location.pathname == "/profile.html") {

const profilePic = document.getElementById("profile-pic");
const dropdownMenu = document.getElementById("dropdown-menu");
const loginBtn = document.getElementById("login-btn");
const userProfile = document.getElementById("user-profile");

// Toggle Dropdown on Click
profilePic.addEventListener("click", () => {
  dropdownMenu.classList.toggle("show");
});

// Close Dropdown on Outside Click
document.addEventListener("click", (event) => {
  if (!event.target.closest("#user-profile")) {
    dropdownMenu.classList.remove("show");
  }
});

}


if (window.location.pathname == "/DoctorSearch.html") {

  // Initial render
  renderDoctors(doctors);

  // Add event listeners for search and filters
  document.getElementById("searchBar").addEventListener("input", filterDoctors);
  document
    .getElementById("specialization")
    .addEventListener("change", filterDoctors);
  document
    .getElementById("experience")
    .addEventListener("input", filterDoctors);
  document.getElementById("ratings").addEventListener("input", filterDoctors);




}
