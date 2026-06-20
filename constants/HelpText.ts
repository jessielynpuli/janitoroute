
export const HELP_SECTIONS = {
  SYSTEM: [
    {
      title: "How to Switch User Roles",
      content: "1. Open the main Menu Bar.\n2. Locate the role selection buttons.\n3. Tap the button for the role you wish to switch to (Guest, Janitor, or Admin).\n4. Enter Passkey for Janitor or Admin.\n5. The application will instantly reload, updating your permissions."
    },
    {
      title: "Understanding Map Colors",
      content: "• Green: Empty and ready to use.\n• Yellow: Half-Full.\n• Red: Full (Please use a different bin)."
    }
  ],
  GUEST: [
    {
      title: "How to Report a Bin",
      content: "1. Open the map to locate the wastebin nearest to you.\n2. Tap the bin's icon to open details.\n3. Select the status (Half-Full or Full) and submit."
    },

  ],
  JANITOR: [
    {
      title: "How to Clear a Full Bin",
      content: "1. Check your Dashboard for prioritized tasks.\n2. Navigate to the bin and empty the trash.\n3. Tap the bin icon on the map and update status to Empty to clear the alert."
    }
  ],
  ADMIN: [
    {
      title: "Map & Node Management",
      content: "• Add Area: Use the 'CHOOSE AREA' dropdown > '+ Add New Area'.\n• Delete Area: Select area > 'Delete Current Area'.\n• Add Landmark/Bin: Tap 'Add' button > Select connection > Set difficulty > Save.\n• Delete Node: Tap 'Remove Nodes' (Red mode) > Tap icon > Tap 'Remove Nodes' again to exit."
    },
    {
      title: "Reviewing the Dashboard",
      content: "1. View 'rush hours' for bin fill rates.\n2. Identify 'Top Hotspot Areas'.\n3. Monitor 'Accomplished Tasks' for janitor activity."
    }
  ],
  SUPPORT: [
    {
      title: "How to Contact Technical Support",
      content: "1. Open the Menu Bar.\n2. Tap Support.\n3. Describe the problem, include your role (Admin/Janitor/Student), and tap Submit."
    }
  ]
};