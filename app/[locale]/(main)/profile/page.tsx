"use client";
import { useProfile } from "@/hooks/useProfile";
import { ProfileView } from "./_components/ProfileView";

const ProfilPage = () => {
  const profile = useProfile();

  return <ProfileView {...profile} />;
};

export default ProfilPage;
