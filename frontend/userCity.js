const localityOptions = {
  Mumbai: [
    "Andheri",
    "Bandra",
    "Borivali",
    "Byculla",
    "Chembur",
    "Colaba",
    "Dadar",
    "Goregaon",
    "Kandivali",
    "Kurla",
    "Lower Parel",
    "Malad",
    "Marine Drive",
    "Matunga",
    "Mulund",
    "Powai",
    "Sion",
    "Thane",
    "Vikhroli",
    "Vile Parle",
    "Worli",
    "Juhu",
    "Khar",
    "Mahalaxmi",
    "Shivaji Park",
    "Chakala",
    "Cuffe Parade",
    "Versova",
    "Lokhandwala",
    "Girgaon",
    "Parel",
    "Malabar Hill",
    "Bhayandar",
    "Mumbra",
    "Turbhe",
    "Vashi",
  ],
}

const localityDropdown = document.getElementById("localitySelect")
const searchForm = document.getElementById("searchForm")
const searchResults = document.getElementById("searchResults")

// Populate locality dropdown
function updateLocalities() {
  const selectedCity = "Mumbai"
  const localities = localityOptions[selectedCity] || []

  localityDropdown.innerHTML = ""   //clear previous options

  const defaultOption = document.createElement("option")
  defaultOption.value = ""
  defaultOption.textContent = "Select locality"
  defaultOption.disabled = true
  defaultOption.selected = true
  localityDropdown.appendChild(defaultOption)

//Add each locality to dropdown
  localities.sort().forEach((locality) => {
    const option = document.createElement("option")
    option.value = locality
    option.textContent = locality
    localityDropdown.appendChild(option)
  })
}
updateLocalities()

// Handle form submission(when user clicks on submit button)
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const locality = localityDropdown.value
  const serviceType = document.getElementById("serviceTypeSelect").value

  // Show loading state
  searchResults.innerHTML = '<div class="loading">Searching for maids...</div>'

  try {
    const response = await fetch("/api/search-maids", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locality, serviceType }),
    })

    if (!response.ok) {
      throw new Error("Network response was not ok")
    }

    const maids = await response.json()
    displayResults(maids, locality, serviceType)
  } catch (error) {
    console.error("Error:", error)
    searchResults.innerHTML =
      '<div class="error-message">An error occurred while searching for maids. Please try again.</div>'
  }
})

// Display search results 
function displayResults(maids, locality, serviceType) {
  searchResults.innerHTML = ""

  // Add results header
  const resultsHeader = document.createElement("div")
  resultsHeader.className = "results-header"
  resultsHeader.innerHTML = `
        <div class="results-count">
            ${maids.length} "${serviceType}" found in "${locality}" locality
        </div>
    `
  searchResults.appendChild(resultsHeader)

  if (maids.length === 0) {
    const noResults = document.createElement("div")
    noResults.className = "no-results"
    noResults.innerHTML = `
            <h3>No maids found</h3>
            <p>Try searching with different locality or service type.</p>
        `
    searchResults.appendChild(noResults)
    return
  }

  maids.forEach((maid) => {
    const maidCard = document.createElement("div")
    maidCard.className = "maid-card"
    maidCard.innerHTML = `
            <div class="maid-profile-section">
                <img 
                    src="${maid.photo || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-26%20at%204.56.16%E2%80%AFPM-9OTt1VuPp2cAK5pZNvSoLi6TZEHU53.png"}" 
                    alt="${maid.fullName}'s profile picture" 
                    class="maid-profile-pic"
                >
            </div>
            <div class="maid-info">
                <h3 class="maid-name">${maid.fullName}</h3>
                <div class="maid-detail"><strong>Address :-</strong> <span>${maid.address || maid.locality}</span></div>
                <div class="maid-detail"><strong>Work Experience :-</strong> <span>${maid.experience} year${maid.experience > 1 ? "s" : ""}</span></div>
                <div class="maid-detail"><strong>City :-</strong> <span>${maid.city || "Mumbai"}</span></div>
                <div class="maid-detail"><strong>Working Hours :-</strong> <span>${maid.workingHours}</span></div>
                <div class="maid-detail"><strong>Expected Salary :-</strong> <span>₹${maid.salary}/month</span></div>
                <button class="book-now-btn" onclick="bookMaid('${maid._id}')">Book Now</button>
            </div>
            <div class="id-proof-section">
                <img 
                    src="${maid.idProofImage || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-26%20at%204.56.16%E2%80%AFPM-9OTt1VuPp2cAK5pZNvSoLi6TZEHU53.png"}" 
                    alt="ID Proof" 
                    class="id-proof-img"
                >
                <div class="id-proof-label">Aadhar Card</div>
            </div>
        `
    searchResults.appendChild(maidCard)
  })
}

function bookMaid(maidId) {
  window.location.href = `userBooking.html?maidId=${maidId}`
}

// Authentication and user management
function updateUserGreeting() {
  const userData = JSON.parse(localStorage.getItem("userData"))
  if (userData && userData.firstName) {
    document.getElementById("userGreeting").textContent = `HELLO, ${userData.firstName.toUpperCase()}`
  }
}

function logout() {
  localStorage.removeItem("userData")
  window.location.href = "first.html"
}

function checkAuth() {
  const userData = localStorage.getItem("userData")
  if (!userData) {
    window.location.href = "login.html"
  }
}



// Initialize page
window.addEventListener("load", () => {
  checkAuth()
  updateUserGreeting()
})
