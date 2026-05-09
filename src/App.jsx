import { Routes, Route } from "react-router-dom";
import TypeRaidSelection from "./pages/TypeRaidSelection";
import RaidSelection from "./pages/RaidSelection";
import AttendanceController from "./pages/AttendanceController";
import AttendanceValidation from "./pages/AttendanceValidation";
import RaidHistory from "./pages/RaidHistory";
import RaidHistoryView from "./pages/RaidHistoryView"
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/list_selection" element={<TypeRaidSelection />} />
      <Route path="/raid_selection" element={<RaidSelection />} />
      <Route path="/attendance_sheet" element={<AttendanceController />} />
      <Route path="/attendance_validation" element={<AttendanceValidation />} />
      <Route path="/history" element={<RaidHistory />} />
      <Route path="/history/view" element={<RaidHistoryView/>} />
      <Route path="/registration" element={<RegistrationPage/>} />
    </Routes>
  );
}

export default App;
