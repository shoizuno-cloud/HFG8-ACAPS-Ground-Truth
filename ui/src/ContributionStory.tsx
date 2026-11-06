import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CommunityPoster } from "./CommunityPoster";
import { mock } from "./api";
import type { Calibration } from "./service";
import type { CommunityWorld } from "./community-world";
import "./contribution-story.css";

gsap.registerPlugin(ScrollTrigger);
const labels = [
  "Your story",
  "Following through",
  "Seeing earlier",
  "Joining perspectives",
  "Human outcomes",
  "Thank you",
];
function phase(offset: number, anchors: number[]) {
  for (let i = anchors.length - 2; i >= 0; i--) {
    if (offset >= anchors[i])
      return (
        i +
        Math.min(
          1,
          (offset - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]),
        )
      );
  }
  return 0;
}

export function ContributionStory({
  report,
  token,
}: {
  report: Calibration;
  token: string;
}) {
  const root = useRef<HTMLElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    world = useRef<CommunityWorld | null>(null),
    progress = useRef(0),
    pauseRef = useRef(false);
  const [active, setActive] = useState(0),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [engine, setEngine] = useState("loading");
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    pauseRef.current = paused;
    if (!paused) world.current?.render(progress.current);
  }, [paused]);
  useEffect(() => {
    if (reduced) {
      setEngine("poster");
      return;
    }
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let instance: CommunityWorld | undefined;
    const target = canvas.current!;
    const lost = (event: Event) => {
      event.preventDefault();
      instance?.dispose();
      world.current = null;
      setEngine("fallback");
    };
    const visible = () => {
      if (!document.hidden) world.current?.render(progress.current);
    };
    setEngine("loading");
    import("./community-world")
      .then((module) => {
        if (cancelled) return;
        try {
          instance = module.createCommunityWorld(target);
          world.current = instance;
          const resize = () => {
            const rect = target.getBoundingClientRect();
            instance?.resize(rect.width, rect.height);
          };
          resize();
          instance.render(progress.current);
          setEngine("webgl");
          observer = new ResizeObserver(resize);
          observer.observe(target);
          target.addEventListener("webglcontextlost", lost);
          document.addEventListener("visibilitychange", visible);
        } catch {
          setEngine("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setEngine("fallback");
      });
    return () => {
      cancelled = true;
      observer?.disconnect();
      target.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", visible);
      instance?.dispose();
      world.current = null;
    };
  }, [reduced]);
  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    if (reduced) {
      setActive(0);
      return;
    }
    let disposed = false;
    const articles = Array.from(
      section.querySelectorAll<HTMLElement>(".story-chapter"),
    );
    let anchors: number[] = [];
    const measure = () => {
      const top = section.getBoundingClientRect().top;
      anchors = articles.map((node) => node.getBoundingClientRect().top - top);
    };
    measure();
    const rig = { offset: 0 };
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rig,
        { offset: 0 },
        {
          offset: () => anchors[anchors.length - 1],
          ease: "none",
          onUpdate: () => {
            progress.current = phase(rig.offset, anchors);
            if (!pauseRef.current) world.current?.render(progress.current);
          },
          scrollTrigger: {
            trigger: section,
            endTrigger: articles[articles.length - 1],
            start: "top top",
            end: "top top",
            scrub: 0.45,
            invalidateOnRefresh: true,
            onRefreshInit: measure,
            onUpdate: (self) => {
              const exact = phase(
                self.progress * anchors[anchors.length - 1],
                anchors,
              );
              const chapter = Math.min(5, Math.floor(exact + 0.025));
              setActive((previous) =>
                previous === chapter ? previous : chapter,
              );
            },
          },
        },
      );
    }, section);
    document.fonts.ready.then(() => {
      if (!disposed) ScrollTrigger.refresh();
    });
    return () => {
      disposed = true;
      ctx.revert();
    };
  }, [reduced]);

  const motion = reduced ? "reduced" : paused ? "paused" : "scroll";
  return (
    <section
      ref={root}
      className={`community-experience ${reduced ? "community-static" : ""}`}
      aria-label="Your verified contribution"
      data-chapter={active}
      data-motion={motion}
      data-renderer={engine}
    >
      <div className="community-world story-visual">
        <div className="world-field">
          <CommunityPoster />
          <canvas
            ref={canvas}
            className="community-canvas"
            aria-hidden="true"
            style={{ opacity: engine === "webgl" ? 1 : 0 }}
          />
        </div>
        <div className="world-interface">
          <div className="world-caption">
            <span>{labels[active]}</span>
            <div className="world-steps" aria-hidden="true">
              {labels.map((label, i) => (
                <span key={label} className={active === i ? "current" : ""} />
              ))}
            </div>
          </div>
          <div className="world-utilities">
            <span>Community illustration, not a count of people</span>
            {!reduced ? (
              <button
                type="button"
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? "Resume motion" : "Pause motion"}
              </button>
            ) : (
              <span>Reduced motion</span>
            )}
          </div>
        </div>
      </div>
      <div className="community-copy">
        <article className="story-chapter chapter-welcome" id="your-story">
          <div className="chapter-copy">
            <p className="chapter-label">
              <LockKeyhole size={14} />
              An independent contribution
            </p>
            <h1>
              Your story so far.
              <br />
              Thank you for being part of ours.
            </h1>
            <p>
              {report.n_resolved
                ? "You’ve shared your judgment. Here’s a little look at what you’ve contributed, and the story we’re still following."
                : "Every contribution starts with one thoughtful view. Here’s where your story will grow."}
            </p>
            <a href="#following-through" className="story-scroll-cue">
              Take a little look back <ArrowDown size={16} />
            </a>
            <p className="world-demo-note">
              <ShieldCheck size={14} />
              {mock
                ? "Synthetic demonstration · historical fixture, not linked to your new demo answer"
                : "Based on your private calibration report. Your identity stays private."}
            </p>
          </div>
        </article>
        <article className="story-chapter" id="following-through">
          <div className="chapter-copy">
            <p className="chapter-label">
              {report.n_resolved
                ? "Since your first contribution"
                : "Your first chapter starts here"}
            </p>
            <h2>
              You’ve seen your
              <br />
              forecasts through.
            </h2>
            <div className="contribution-number">
              {report.n_resolved}
              <span>resolved forecasts</span>
            </div>
            <p>
              {report.n_resolved
                ? "These forecasts now have known outcomes. That’s a record of your judgment we can learn from, good calls and misses alike."
                : "Your record will grow when forecasts resolve."}
            </p>
            <p className="chapter-note">
              {report.n_resolved
                ? `${report.n_resolved} forecasts resolved. Your calibration can now be checked.`
                : "Waiting for your first forecast to resolve."}
            </p>
          </div>
        </article>
        <article className="story-chapter" id="seeing-earlier">
          <div className="chapter-copy">
            <p className="chapter-label">A small moment worth recognising</p>
            <h2>
              {report.moved_before_acaps
                ? "You spotted the signal before the rating caught up."
                : "Every forecast is another chance to learn."}
            </h2>
            <span className="early-count">{report.moved_before_acaps}</span>
            <h3>Earlier correct signals</h3>
            <p>
              Of {report.n_resolved} resolved forecasts, you were on the correct
              side of 50% while the ACAPS rating was not.
            </p>
            <p className="chapter-note">
              This recognises forecasting contribution. It does not show that an
              operational decision changed.
            </p>
          </div>
        </article>
        <article className="story-chapter" id="joining-perspectives">
          <div className="chapter-copy">
            <p className="chapter-label">Your part in a shared picture</p>
            <h2>
              A name isn’t needed.
              <br />
              Your perspective is.
            </h2>
            <p>
              Yours is one independent view in the panel. Together, those views
              give an analyst more to consider before deciding what changes.
            </p>
            <p className="chapter-note">
              Analyst influence has not yet been linked to this private report.
              The group is one validation layer among others.
            </p>
          </div>
        </article>
        <article className="story-chapter chapter-outcomes" id="human-outcomes">
          <div className="chapter-copy">
            <p className="chapter-label">And behind it all, people</p>
            <h2 id="human-impact-title">
              The chapter we want
              <br />
              to follow next.
            </h2>
            <p>
              People are the reason for doing this. The outcomes that matter
              most need evidence of their own.
            </p>
            <div className="community-outcomes">
              <div>
                <span>People helped</span>
                <strong>Not yet measured</strong>
                <p>
                  Awaiting verified records of people reached by actions
                  informed by the panel.
                </p>
              </div>
              <div>
                <span>Lives changed</span>
                <strong>Not yet measured</strong>
                <p>Awaiting follow-up evidence of what changed for people.</p>
              </div>
            </div>
            <p className="chapter-note">
              Any verified reach belongs to the panel’s shared contribution. It
              is counted once, never multiplied by the number of experts.
            </p>
          </div>
        </article>
        <article className="story-chapter chapter-thanks" id="thank-you">
          <div className="chapter-copy">
            <p className="chapter-label">A shared purpose</p>
            <h2>
              Quietly contributing.
              <br />
              Very much appreciated.
            </h2>
            <p>
              You bring your perspective; the panel brings theirs. Thank you for
              making room for an independent view, even when your name stays out
              of it.
            </p>
            <a
              className="calibration-cta"
              href={`/me/${encodeURIComponent(token)}/calibration`}
            >
              View your calibration <ArrowRight size={16} />
            </a>
            <details className="community-method">
              <summary>How these measures are counted</summary>
              <p>
                Resolved forecasts and earlier correct signals come from your
                private calibration report. Earlier correct means your
                probability was on the correct side of 50% while the ACAPS
                rating was not. It is not a count of lives saved, people helped
                or decisions influenced.
              </p>
              <p>
                People helped and lives changed remain unmeasured until
                supported action and outcome records are available. Missing
                evidence is not a zero. Shared reach must be counted once, with
                attribution limits stated.
              </p>
              <p>
                The landscape and figures symbolise collaboration. Their number
                and growth do not represent beneficiaries or measured
                environmental impact. No engagement scores, streaks or public
                identity appear here.
              </p>
            </details>
          </div>
        </article>
      </div>
    </section>
  );
}
