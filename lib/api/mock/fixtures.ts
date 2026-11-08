import type { Category, EventDTO, OrderDTO, Person, UserDTO } from "../types";

export const DEMO_USER: UserDTO = {
  _id: "user_demo",
  firstName: "Demo",
  lastName: "Attendee",
  email: "demo@example.com",
  username: "demo",
};

const people: Record<string, Person> = {
  demo: { _id: "user_demo", firstName: "Demo", lastName: "Attendee" },
  jazz: { _id: "user_jazz", firstName: "Layla", lastName: "Moradi" },
  tech: { _id: "user_tech", firstName: "Arman", lastName: "Kazemi" },
  food: { _id: "user_food", firstName: "Sara", lastName: "Hosseini" },
  calm: { _id: "user_calm", firstName: "Nima", lastName: "Rahimi" },
  film: { _id: "user_film", firstName: "Dariush", lastName: "Amini" },
};
export const BUYERS: Person[] = [
  { _id: "user_b1", firstName: "Mina", lastName: "Karimi" },
  { _id: "user_b2", firstName: "Omid", lastName: "Sadeghi" },
  { _id: "user_b3", firstName: "Yasaman", lastName: "Noori" },
  { _id: "user_b4", firstName: "Kian", lastName: "Fallah" },
  { _id: "user_b5", firstName: "Bita", lastName: "Ebrahimi" },
];

export const CATEGORIES: Category[] = [
  { _id: "cat_music", name: "Music" },
  { _id: "cat_tech", name: "Technology" },
  { _id: "cat_food", name: "Food" },
  { _id: "cat_wellness", name: "Wellness" },
  { _id: "cat_arts", name: "Arts" },
  { _id: "cat_business", name: "Business" },
];
const cat = (id: string) => CATEGORIES.find((c) => c._id === id)!;

type Seed = {
  id: string; title: string; cat: string; org: keyof typeof people; location: string;
  price: string; days: number; hour: number; desc: string; fa?: { title: string; location: string };
};
const SEEDS: Seed[] = [
  { id: "e1", title: "Open-Air Jazz Night", cat: "cat_music", org: "demo", location: "Riverside Park, Ahvaz", price: "18", days: 6, hour: 19, desc: "An evening of live jazz by the river. Bring a blanket; food trucks open from six.", fa: { title: "شب جاز در فضای باز", location: "پارک ساحلی، اهواز" } },
  { id: "e2", title: "React & Next.js Meetup", cat: "cat_tech", org: "tech", location: "Innovation Hub, Tehran", price: "12", days: 9, hour: 18, desc: "Three talks on server components, caching and testing, followed by open networking.", fa: { title: "میت‌آپ ری‌اکت و نکست", location: "هاب نوآوری، تهران" } },
  { id: "e3", title: "Street Food Festival", cat: "cat_food", org: "food", location: "Old Bazaar Square", price: "5", days: 14, hour: 12, desc: "Forty stalls, one square. Regional dishes, desserts and a cook-off at four.", fa: { title: "جشنواره غذای خیابانی", location: "میدان بازار قدیم" } },
  { id: "e4", title: "Sunrise Yoga Session", cat: "cat_wellness", org: "calm", location: "Lakeside Pavilion", price: "0", days: 3, hour: 6, desc: "A gentle 60-minute flow for all levels as the sun comes up. Mats provided.", fa: { title: "یوگای سپیده‌دم", location: "آلاچیق کنار دریاچه" } },
  { id: "e5", title: "Indie Film Screening", cat: "cat_arts", org: "film", location: "Studio Cinema", price: "8", days: 11, hour: 20, desc: "Four award-winning shorts followed by a Q&A with the directors.", fa: { title: "اکران فیلم مستقل", location: "سینما استودیو" } },
  { id: "e6", title: "Startup Pitch Evening", cat: "cat_business", org: "tech", location: "Co-Work Tower", price: "15", days: 20, hour: 17, desc: "Ten founders, five minutes each, one panel of investors. Demo tables after.", fa: { title: "شب پیچ استارتاپ‌ها", location: "برج کار مشترک" } },
  { id: "e7", title: "Acoustic Sessions Vol. 3", cat: "cat_music", org: "jazz", location: "The Attic Café", price: "10", days: 17, hour: 21, desc: "Stripped-back sets from five local songwriters in a candle-lit room." },
  { id: "e8", title: "Intro to Pottery Workshop", cat: "cat_arts", org: "demo", location: "Clay House Studio", price: "30", days: 22, hour: 10, desc: "Learn to centre, pull and trim. Take home your own bowl after firing." },
  { id: "e9", title: "TypeScript Deep Dive", cat: "cat_tech", org: "tech", location: "Online", price: "0", days: 25, hour: 19, desc: "A live-coded session on generics, narrowing and designing safe APIs." },
  { id: "e10", title: "Saffron & Spice Cooking Class", cat: "cat_food", org: "food", location: "Bazaar Kitchen", price: "25", days: 28, hour: 15, desc: "Cook three classic dishes with a chef and eat them together." },
  { id: "e11", title: "Mindful Breathing Evening", cat: "cat_wellness", org: "calm", location: "Lakeside Pavilion", price: "6", days: 31, hour: 18, desc: "Guided breathwork and a short meditation to close the week." },
  { id: "e12", title: "Founders' Breakfast", cat: "cat_business", org: "jazz", location: "Rooftop Lounge", price: "0", days: 35, hour: 8, desc: "Informal breakfast for early-stage founders. Free, but seats are limited." },
];

export function seedEvents(now: Date): EventDTO[] {
  return SEEDS.map((s, i) => {
    const start = new Date(now);
    start.setDate(start.getDate() + s.days);
    start.setHours(s.hour, 0, 0, 0);
    const end = new Date(start.getTime() + 2.5 * 3600_000);
    const isFree = s.price === "0";
    return {
      _id: s.id,
      title: s.title,
      description: s.desc,
      location: s.location,
      imageUrl: `/events/${i + 1}.svg`,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      createdAt: new Date(now.getTime() - (i + 1) * 3600_000).toISOString(),
      price: s.price,
      isFree,
      url: "",
      category: cat(s.cat),
      organizer: people[s.org],
      fa: s.fa,
    };
  });
}

export function seedOrders(events: EventDTO[], now: Date): OrderDTO[] {
  const ev = (id: string) => events.find((e) => e._id === id)!;
  const mk = (n: number, eventId: string, buyer: Person, hoursAgo: number): OrderDTO => {
    const e = ev(eventId);
    return {
      _id: `o${n}`,
      createdAt: new Date(now.getTime() - hoursAgo * 3600_000).toISOString(),
      stripeId: `mock_pi_${n.toString().padStart(4, "0")}`,
      totalAmount: e.price,
      event: e,
      buyer,
    };
  };
  return [
    // tickets the demo user holds
    mk(1, "e2", people.demo, 30),
    mk(2, "e5", people.demo, 52),
    // orders on the demo user's own event e1
    mk(3, "e1", BUYERS[0], 5),
    mk(4, "e1", BUYERS[1], 9),
    mk(5, "e1", BUYERS[2], 20),
    mk(6, "e1", BUYERS[3], 41),
    mk(7, "e1", BUYERS[4], 70),
  ];
}
