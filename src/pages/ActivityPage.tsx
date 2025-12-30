import { ArrowLeft, Clock, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const ActivityPage = () => {
  const navigate = useNavigate();

  const activities = [
    { icon: Heart, text: "Your posts received 24 likes this week", time: "This week" },
    { icon: MessageCircle, text: "5 new comments on your posts", time: "2 days ago" },
    { icon: UserPlus, text: "You gained 12 new followers", time: "This month" },
    { icon: Clock, text: "Average time spent: 45 mins/day", time: "Last 7 days" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Your Activity</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="p-6 bg-card rounded-xl border border-border text-center">
          <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-foreground">2h 15m</h2>
          <p className="text-muted-foreground text-sm">Average daily time</p>
        </div>

        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="p-4 bg-card rounded-xl border border-border flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <activity.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm">{activity.text}</p>
                <p className="text-muted-foreground text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ActivityPage;