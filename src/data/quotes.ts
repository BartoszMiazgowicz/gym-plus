export interface Quote {
    text: string;
    author: string;
}

export const QUOTES: Quote[] = [
    // Bodybuilding legends
    { text: 'Everybody wanna be a bodybuilder, but don’t nobody wanna lift no heavy-ass weight.', author: 'Ronnie Coleman' },
    { text: 'Yeah buddy! Light weight, baby!', author: 'Ronnie Coleman' },
    { text: 'Nothing is impossible. The word itself says "I’m possible"!', author: 'Audrey Hepburn' },
    { text: 'Strength does not come from winning. Your struggles develop your strengths.', author: 'Arnold Schwarzenegger' },
    { text: 'The last three or four reps is what makes the muscle grow.', author: 'Arnold Schwarzenegger' },
    { text: 'No pain, no gain. Shut up and train.', author: 'Arnold Schwarzenegger' },
    { text: 'I don’t train because I enjoy it. I train because I want results.', author: 'Dorian Yates' },
    { text: 'Pain is just weakness leaving the body.', author: 'C.T. Fletcher' },
    { text: 'You gotta be a beast, dawg!', author: 'C.T. Fletcher' },
    { text: 'It ain’t about how hard you hit. It’s about how hard you can get hit and keep moving forward.', author: 'Rocky Balboa' },
    { text: 'Train like a beast, look like a beauty.', author: 'Kai Greene' },
    { text: 'The body achieves what the mind believes.', author: 'Jay Cutler' },
    { text: 'Get your mind right, and your body will follow.', author: 'Kali Muscle' },
    { text: 'Sacrifice now, so you can celebrate later.', author: 'Larry Wheels' },
    { text: 'Discipline weighs ounces, regret weighs tons.', author: 'Branch Warren' },
    { text: 'One more rep. Always one more rep.', author: 'Rich Piana' },
    { text: 'Live like nobody else, so you can live like nobody else.', author: 'Rich Piana' },
    // Tren Twins style hype
    { text: 'Quads like tree trunks, back like a gorilla — it’s the sauce, bro.', author: 'Tren Twins' },
    { text: 'We don’t skip leg day, we don’t skip anything, bro.', author: 'Tren Twins' },
    { text: 'Big back gang never sleeps.', author: 'Tren Twins' },
    { text: 'Chicken, rice, broccoli — and heavy-ass weight. That’s the whole plan.', author: 'Tren Twins' },
    // Basketball / athlete legends
    { text: 'I’ve failed over and over and over again in my life. And that is why I succeed.', author: 'Michael Jordan' },
    { text: 'Talent wins games, but teamwork and intelligence win championships.', author: 'Michael Jordan' },
    { text: 'Some people want it to happen, some wish it would happen, others make it happen.', author: 'Michael Jordan' },
    { text: 'Great things come from hard work and perseverance. No excuses.', author: 'Kobe Bryant' },
    { text: 'The most important thing is to try and inspire people so that they can be great in whatever they want to do.', author: 'Kobe Bryant' },
    { text: 'If you’re afraid to fail, then you’re probably going to fail.', author: 'Kobe Bryant' },
    { text: 'I hated every minute of training, but I said, “Don’t quit. Suffer now and live the rest of your life as a champion.”', author: 'Muhammad Ali' },
    { text: 'It’s the repetition of affirmations that leads to belief. And once that belief becomes a deep conviction, things begin to happen.', author: 'Muhammad Ali' },
    { text: 'Float like a butterfly, sting like a bee.', author: 'Muhammad Ali' },
    // Mental toughness / modern
    { text: 'You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential.', author: 'David Goggins' },
    { text: 'Motivation is crap. Motivation comes and goes. When you’re driven, whatever is in front of you will get destroyed.', author: 'David Goggins' },
    { text: 'Stay hard.', author: 'David Goggins' },
    { text: 'It’s never a good time to work out. It just has to be done.', author: 'David Goggins' },
    { text: 'I’m not going to stop until I run out of talent.', author: 'Conor McGregor' },
    { text: 'There’s no talent here, this is hard work. This is an obsession.', author: 'Conor McGregor' },
    { text: 'You either get ready, or you get wrecked.', author: 'Conor McGregor' },
    { text: 'Hard work beats talent when talent doesn’t work hard.', author: 'Tim Notke' },
    { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
    { text: 'The only bad workout is the one that didn’t happen.', author: 'Nieznany siłacz' },
    { text: 'Winners train, losers complain.', author: 'Nieznany siłacz' },
    { text: 'Excuses don’t burn calories.', author: 'Nieznany siłacz' },
    { text: 'The gym is my therapy. Iron never lies.', author: 'Nieznany siłacz' },
    { text: 'Sweat is just fat crying.', author: 'Nieznany siłacz' },
    { text: 'Do it for the pump. Do it for you.', author: 'Nieznany siłacz' },
    { text: 'To be number one, you have to train like you’re number two.', author: 'Maurice Greene' },
    { text: 'Kto nie ryzykuje, ten nie pije szampana. Kto nie ćwiczy, ten nie ma ramion.', author: 'GYM+ Motywacja' },
    { text: 'Ciężar nie kłamie — albo go podnosisz, albo wracasz do domu.', author: 'GYM+ Motywacja' },
];

export function getRandomQuote(exclude?: string): Quote {
    if (QUOTES.length === 1) return QUOTES[0];
    let quote: Quote;
    do {
        quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    } while (exclude && quote.text === exclude);
    return quote;
}
