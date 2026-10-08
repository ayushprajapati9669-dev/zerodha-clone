import axios from "axios";

const API_URL =
      "http://localhost:3000/api/notifications/preferences";

// =========================================
// GET NOTIFICATION PREFERENCES
// =========================================

export const getNotificationPreferences = async () => {

      try {

            const response = await axios.get(
                  API_URL,
                  {
                        withCredentials: true,
                  }
            );


            return response.data.preferences;

      } catch (error) {

            console.error(
                  "GET PREFERENCES ERROR:",
                  error
            );

            throw error;
      }
};


// =========================================
// SAVE NOTIFICATION PREFERENCES
// =========================================

export const saveNotificationPreferences = async (
      preferences
) => {

    
      try {

            const response = await axios.patch(
                  API_URL,
                  preferences,
                  {
                        withCredentials: true,
                        headers: {
                              "Content-Type": "application/json",
                        },
                  }
            );


            return response.data.preferences;

      } catch (error) {

            console.error(
                  "PATCH PREFERENCES ERROR:",
                  error
            );

            console.error(
                  "PATCH ERROR RESPONSE:",
                  error.response?.data
            );

            throw error;
      }
};