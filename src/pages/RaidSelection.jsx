import RaidCard from "../components/RaidCard";
import "../css/RaidSelection.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../hooks/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

function RaidSelection() {
 
  const [selected, setSelected] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const type = location.state?.type;

  // 🔥 Auth guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      } else {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔥 Fix refresh: se manca type → torna indietro
  useEffect(() => {
    if (!authLoading && !type) {
      navigate("/list_selection");
    }
  }, [authLoading, type]);

  const raids = [
    { id: "nax_10", name: "Naxxramas 10 Players", image: "https://static.wikia.nocookie.net/wowpedia/images/c/cd/Hearthstone_-_Curse_of_Naxxramas.jpg" },
    { id: "nax_25", name: "Naxxramas 25 Players", image: "https://static.wikia.nocookie.net/wowpedia/images/c/cd/Hearthstone_-_Curse_of_Naxxramas.jpg" },
    { id: "os_10", name: "Obsidian Sanctum 10 Players", image: "https://tse3.mm.bing.net/th/id/OIP.mdV_ciwkDbEVwnIxiCK0CwHaC2?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "os_25", name: "Obsidian Sanctum 25 Players", image: "https://tse3.mm.bing.net/th/id/OIP.mdV_ciwkDbEVwnIxiCK0CwHaC2?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "eoe_10", name: "Eye of Eternity 10 Players", image: "https://external-preview.redd.it/ULsi54zpm08i-wFZR8Oo2jFolJGkg8sZI8cbjuEbLpo.jpg?auto=webp&s=3a226ffd71f39672d085625434f1660482cb5245" },
    { id: "eoe_25", name: "Eye of Eternity 25 Players", image: "https://external-preview.redd.it/ULsi54zpm08i-wFZR8Oo2jFolJGkg8sZI8cbjuEbLpo.jpg?auto=webp&s=3a226ffd71f39672d085625434f1660482cb5245" },
    { id: "voa_10", name: "Vault of Archavon 10 Players", image: "https://www.warcrafttavern.com/wp-content/uploads/2022/09/Vault-of-archavon-far.jpg" },
    { id: "voa_25", name: "Vault of Archavon 25 Players", image: "https://www.warcrafttavern.com/wp-content/uploads/2022/09/Vault-of-archavon-far.jpg" },
    { id: "ulduar_10", name: "Ulduar 10 Players", image: "https://wallpapers.com/images/hd/wow-ulduar-raid-loading-screen-yn8p9b93zbbo8fj2.webp" },
    { id: "ulduar_25", name: "Ulduar 25 Players", image: "https://wallpapers.com/images/hd/wow-ulduar-raid-loading-screen-yn8p9b93zbbo8fj2.webp" },
    { id: "toc_10", name: "Trial of the Crusader 10 Players", image: "https://res.cloudinary.com/mesorchoo/image/upload/c_crop,dpr_auto,f_auto,q_auto,w_1200/v1588054858/mesorchoo.com/artwork/instances/Trial_of_the_Crusader_loading_screen_vkvscy.jpg" },
    { id: "toc_25", name: "Trial of the Crusader 25 Players", image: "https://res.cloudinary.com/mesorchoo/image/upload/c_crop,dpr_auto,f_auto,q_auto,w_1200/v1588054858/mesorchoo.com/artwork/instances/Trial_of_the_Crusader_loading_screen_vkvscy.jpg" },
    { id: "tgc_10", name: "Trial of the Grand Crusader 10 Players", image: "https://www.allmmorpg.ru/wp-content/uploads/2022/07/480098.jpg" },
    { id: "tgc_25", name: "Trial of the Grand Crusader 25 Players", image: "https://www.allmmorpg.ru/wp-content/uploads/2022/07/480098.jpg" },
    { id: "icc_10", name: "Icecrown Citadel 10 Players", image: "https://res.cloudinary.com/mesorchoo/image/upload/c_crop,dpr_auto,f_auto,q_auto,w_1200/v1588050970/mesorchoo.com/artwork/instances/loadscreen-icecrown-citadel-full_lueuqz.jpg" },
    { id: "icc_25", name: "Icecrown Citadel 25 Players", image: "https://res.cloudinary.com/mesorchoo/image/upload/c_crop,dpr_auto,f_auto,q_auto,w_1200/v1588050970/mesorchoo.com/artwork/instances/loadscreen-icecrown-citadel-full_lueuqz.jpg" },
    { id: "rs_10", name: "Ruby Sanctum 10 Players", image: "https://tse3.mm.bing.net/th/id/OIP.nX7vnKp1rx071CW3SV5sqAHaEO?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "rs_25", name: "Ruby Sanctum 25 Players", image: "https://tse3.mm.bing.net/th/id/OIP.nX7vnKp1rx071CW3SV5sqAHaEO?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
  ];

  const handleClick = (type, raidId) => {
    navigate("/attendance_sheet", { state: { type, raidId } });
  };

  // 🔥 blocco mentre Firebase carica
  if (authLoading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>

      <div className="header">
        <h1>Select your Raid</h1>
      </div>

      <div className="grid">
        {raids.map((raid) => (
          <RaidCard
            key={raid.id}
            id={raid.id}
            name={raid.name}
            image={raid.image}
            selected={selected === raid.id}
            onClick={() => {
              setSelected(raid.id);
              handleClick(type, raid.id);
            }}
          />
        ))}
      </div>

    </div>
  );
}

export default RaidSelection;