import ChargeTab from "./charge-tab/ChargeTab.jsx";
import AccountOpening from "./AccountOpening.jsx";
import MaintainanceCharge from "./MaintainanceCharge.jsx";
import OptionalCharge from "./OptionalCharge.jsx";
import ChargeExplain from "./ChargeExplain.jsx";
function ChargeSections() {
  return (
    <>
      <ChargeTab />
      <AccountOpening />
      <MaintainanceCharge />
      <OptionalCharge />
      <ChargeExplain />
    </>
  );
}

export default ChargeSections;
