Handles connection to the database.
Files under this may include supabase.ts (project URL and Secret Keys), and data-fetching functions (like fetchActiveReports(), updateBinStatus()).


api/
├── supabase.ts          # Core initialization client (The URL and Anon Key connection)
├── wastebins/           # 🌟 Feature Folder for Bins
│   └── wb_queries.ts       # Functions: 
                                 - Area
                                     - fetchAllAreas() fetch all areas for selection
                                     - fetchMapDataByArea() once user chooses an area, it will grab the landmarks and wastebins connected to it
                                     - createArea() adding an area
                                     - updateArea() editing any attributes of the area tuple
                                     - deleteArea() deletes area and also deletes all nodes connected to it
                                 - Landmark
                                     - createLandmark() landmark creation
                                     - updateLandmark() edit any landmark attributes
                                     - deleteLandmark() also deletes wb connected to it
                                     Note: no need to read landmarks, area has it
                                 - Wastebins
                                     - createWastebins() add a new wastebin
                                     - fetchWastebinDetails() reads, good for report details
                                     - updateWastebin() update any wb attribute
                                     - deleteWastebin() remove wastebin entirely
    └── report_queries.ts     #Functions
                                - submitWastebinReport ()  checks the user, warn if spam, counts full reports, update the main wastebin if reports are 3 or more
                        
├── edges/               # 🌟 Feature Folder for Path Networks
│   └── edges queries.ts             # Functions: 
                                - fetchNetworkEdges() connect bins to landmarks, landmarks to landmarks
                                - updateEdgeWeight() admin changes weight  
└── auth/                # 🌟 Feature Folder for User Roles (Admin/Janitor/Student)
    └── queries.ts       # Functions: 
                                - signInAnonymously() anon signing in
                                - verifyStaffPin() checks pin to enter admin or janitor mode


Notes:
1. async (Asynchronous)
Putting async in front of a function tells JavaScript: "Hey, this function is special. It contains operations that will take time to finish. Don't block the rest of the app while this runs."

2. await
You can only use await inside an async function. It tells JavaScript: "Pause execution right here on this line until the server finishes sending the data back. Once the data is here, unpack it and move to the next line."

3. Arrow Function
= async (...) =>: This is an Arrow Function syntax, marked as asynchronous. Inside the parentheses are your parameters—the inputs the function needs to do its job (the specific bin's ID and its new status).

4. Destructuring
const { data, error } =: This is called Destructuring. Supabase always returns an object containing two things: a payload named data and a mistake log named error. This syntax cleanly separates them into two easy-to-use variables.
