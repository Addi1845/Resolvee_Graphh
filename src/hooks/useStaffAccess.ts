import { useEffect, useState } from "react";

import { useSession } from "@/hooks/useSession";
import { getMyAccess } from "@/lib/complaints.functions";

/**
 * Tells the UI whether the signed-in person is an official.
 * Used to show only the pages that belong to that person's role.
 */
export function useStaffAccess() {
  const { session, loading } = useSession();
  const [isStaff, setIsStaff] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session) {
      setIsStaff(false);
      setChecked(!loading);
      return;
    }
    let active = true;
    setChecked(false);
    void getMyAccess({ data: undefined })
      .then((result) => {
        if (!active) return;
        setIsStaff(result.isStaff);
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setIsStaff(false);
        setChecked(true);
      });
    return () => {
      active = false;
    };
  }, [session, loading]);

  return { session, isStaff, isCitizen: !!session && checked && !isStaff, checked, loading };
}
