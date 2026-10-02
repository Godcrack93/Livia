import {
  Channel,
  Chorus,
  FeedbackDelay,
  Filter,
  FMSynth,
  getDestination,
  getDraw,
  getTransport,
  Limiter,
  Loop,
  MembraneSynth,
  MonoSynth,
  NoiseSynth,
  PolySynth,
  Reverb,
  Sequence,
  start,
  Synth,
  Vibrato,
} from "tone";
import { CHARACTERS, type CharacterId } from "./characters";

export const BPM = 105;
export const BEAT_SEC = 60 / BPM;

type Voice = {
  setActive: (active: boolean) => void;
};

let unlocked = false;
let master: Reverb | null = null;
const voices = new Map<CharacterId, Voice>();
let beatLoop: Loop | null = null;
let beatCount = 0;
let onBeat: ((beat: number) => void) | null = null;

function noteSeq(
  events: Array<string | null>,
  subdiv: string,
  hit: (time: number, note: string) => void,
): Sequence<string | null> {
  const seq = new Sequence((time, note) => {
    if (note) hit(time, note);
  }, events, subdiv);
  seq.start(0);
  return seq;
}

function flagSeq(
  events: Array<1 | null>,
  subdiv: string,
  hit: (time: number) => void,
): Sequence<1 | null> {
  const seq = new Sequence((time, flag) => {
    if (flag) hit(time);
  }, events, subdiv);
  seq.start(0);
  return seq;
}

function makeVoice(
  volume: number,
  pan: number,
  build: (channel: Channel) => void,
): Voice {
  const channel = new Channel({ volume, pan, mute: true });
  channel.connect(master!);
  build(channel);
  return {
    setActive(active) {
      channel.mute = !active;
    },
  };
}

function buildVoices() {
  voices.set(
    "saci",
    makeVoice(-8, -0.12, (channel) => {
      const kick = new MembraneSynth({
        pitchDecay: 0.04,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.06 },
      }).connect(channel);
      noteSeq(["C2", null, null, null, "C2", null, "G1", null], "8n", (time, note) => {
        kick.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "curupira",
    makeVoice(-9, 0.18, (channel) => {
      const stomp = new MembraneSynth({
        pitchDecay: 0.018,
        octaves: 2.4,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
      }).connect(channel);
      noteSeq([null, "D2", null, "D2", null, "D2", null, "D2"], "8n", (time, note) => {
        stomp.triggerAttackRelease(note, "16n", time);
      });
    }),
  );

  voices.set(
    "caipora",
    makeVoice(-10, -0.22, (channel) => {
      const tom = new MembraneSynth({
        pitchDecay: 0.03,
        octaves: 3.2,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.08 },
      }).connect(channel);
      noteSeq(["A2", null, "E2", null, "A2", "A2", null, "E2"], "8n", (time, note) => {
        tom.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "mapinguari",
    makeVoice(-7, 0.05, (channel) => {
      const boom = new MembraneSynth({
        pitchDecay: 0.08,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.12 },
      }).connect(channel);
      noteSeq(["C1", null, null, null, null, null, "C1", null], "8n", (time, note) => {
        boom.triggerAttackRelease(note, "4n", time);
      });
    }),
  );

  voices.set(
    "boi-bumba",
    makeVoice(-8, 0.28, (channel) => {
      const surdo = new MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4.2,
        envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.08 },
      }).connect(channel);
      noteSeq(["C2", null, null, "G1", "C2", null, "G1", null], "8n", (time, note) => {
        surdo.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "boitata",
    makeVoice(-14, 0.1, (channel) => {
      const filter = new Filter(1600, "highpass").connect(channel);
      const crackle = new NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.004, decay: 0.07, sustain: 0, release: 0.03 },
      }).connect(filter);
      flagSeq([null, 1, null, 1, 1, null, 1, null], "8n", (time) => {
        crackle.triggerAttackRelease(0.06, time, 0.4);
      });
    }),
  );

  voices.set(
    "matinta",
    makeVoice(-13, -0.3, (channel) => {
      const vibrato = new Vibrato(5.5, 0.18).connect(channel);
      const whistle = new Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.08, decay: 0.15, sustain: 0.25, release: 0.2 },
      }).connect(vibrato);
      noteSeq(["E5", null, null, "G5", null, null, "E5", "D5"], "8n", (time, note) => {
        whistle.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "cuca",
    makeVoice(-13, 0.22, (channel) => {
      const filter = new Filter(900, "lowpass").connect(channel);
      const whoosh = new NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.05, decay: 0.42, sustain: 0, release: 0.12 },
      }).connect(filter);
      flagSeq([1, null, null, null, null, null, 1, null], "8n", (time) => {
        filter.frequency.setValueAtTime(2400, time);
        filter.frequency.exponentialRampToValueAtTime(140, time + 0.48);
        whoosh.triggerAttackRelease(0.48, time);
      });
    }),
  );

  voices.set(
    "tutu",
    makeVoice(-16, -0.08, (channel) => {
      const filter = new Filter(900, "bandpass").connect(channel);
      const rustle = new NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.002, decay: 0.05, sustain: 0, release: 0.03 },
      }).connect(filter);
      flagSeq([null, 1, null, 1, null, 1, null, 1], "8n", (time) => {
        rustle.triggerAttackRelease(0.05, time, 0.35);
      });
    }),
  );

  voices.set(
    "anhanga",
    makeVoice(-14, 0.0, (channel) => {
      const delay = new FeedbackDelay("8n", 0.32).connect(channel);
      delay.wet.value = 0.28;
      const pad = new FMSynth({
        harmonicity: 1.8,
        modulationIndex: 3.2,
        oscillator: { type: "sine" },
        envelope: { attack: 0.25, decay: 0.2, sustain: 0.65, release: 0.4 },
        modulation: { type: "triangle" },
        modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.4, release: 0.3 },
      }).connect(delay);
      noteSeq(["C3", null, null, null, "G2", null, null, null], "8n", (time, note) => {
        pad.triggerAttackRelease(note, "2n", time);
      });
    }),
  );

  voices.set(
    "iara",
    makeVoice(-13, -0.16, (channel) => {
      const chorus = new Chorus({ frequency: 1.4, delayTime: 3.2, depth: 0.45, wet: 0.45 }).connect(
        channel,
      );
      chorus.start();
      const melody = new Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.03, decay: 0.12, sustain: 0.35, release: 0.18 },
      }).connect(chorus);
      noteSeq(["C4", "E4", "G4", "E4", "A4", "G4", "E4", "D4"], "8n", (time, note) => {
        melody.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "uirapuru",
    makeVoice(-15, 0.32, (channel) => {
      const bird = new Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.008, decay: 0.1, sustain: 0, release: 0.06 },
      }).connect(channel);
      noteSeq(["G5", null, "E5", "C6", null, "E5", "G5", null], "8n", (time, note) => {
        bird.triggerAttackRelease(note, "16n", time);
      });
    }),
  );

  voices.set(
    "vitoria-regia",
    makeVoice(-14, 0.12, (channel) => {
      const harp = new Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.35, sustain: 0.15, release: 0.3 },
      }).connect(channel);
      noteSeq(["C4", null, "E4", null, "G4", null, "B4", null], "8n", (time, note) => {
        harp.triggerAttackRelease(note, "4n", time);
      });
    }),
  );

  voices.set(
    "mae-do-ouro",
    makeVoice(-15, -0.24, (channel) => {
      const bell = new FMSynth({
        harmonicity: 3.2,
        modulationIndex: 8,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.7, sustain: 0.08, release: 0.35 },
        modulationEnvelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
      }).connect(channel);
      noteSeq(["E5", null, null, "G5", null, null, "B5", "E6"], "8n", (time, note) => {
        bell.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "guaraci",
    makeVoice(-14, 0.08, (channel) => {
      const lead = new Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.45, release: 0.12 },
      }).connect(channel);
      noteSeq(["C5", "D5", "E5", "G5", "E5", "D5", "C5", "G4"], "8n", (time, note) => {
        lead.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "boto",
    makeVoice(-12, -0.18, (channel) => {
      const vocal = new MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 1.6, type: "lowpass", rolloff: -24 },
        envelope: { attack: 0.08, decay: 0.12, sustain: 0.7, release: 0.22 },
        filterEnvelope: {
          attack: 0.06,
          decay: 0.18,
          sustain: 0.35,
          release: 0.25,
          baseFrequency: 280,
          octaves: 2.1,
        },
      }).connect(channel);
      noteSeq(["C3", null, "E3", null, "G3", null, "E3", null], "8n", (time, note) => {
        vocal.triggerAttackRelease(note, "4n", time);
      });
    }),
  );

  voices.set(
    "fulozinha",
    makeVoice(-12, 0.2, (channel) => {
      const call = new Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.1, release: 0.08 },
      }).connect(channel);
      noteSeq([null, "G4", null, "C5", null, "G4", null, "C5"], "8n", (time, note) => {
        call.triggerAttackRelease(note, "16n", time, 0.35);
      });
    }),
  );

  voices.set(
    "jaci",
    makeVoice(-16, 0.0, (channel) => {
      const choir = new PolySynth(Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.18, decay: 0.12, sustain: 0.7, release: 0.4 },
      }).connect(channel);
      const seq = new Sequence(
        (time, chord: string[] | null) => {
          if (chord) choir.triggerAttackRelease(chord, "2n", time);
        },
        [
          ["C3", "E3", "G3"],
          null,
          null,
          null,
          ["A2", "C3", "E3"],
          null,
          null,
          null,
        ],
        "8n",
      );
      seq.start(0);
    }),
  );

  voices.set(
    "negrinho",
    makeVoice(-13, -0.1, (channel) => {
      const chant = new MonoSynth({
        oscillator: { type: "triangle" },
        filter: { Q: 1.2, type: "lowpass" },
        envelope: { attack: 0.04, decay: 0.08, sustain: 0.55, release: 0.16 },
        filterEnvelope: {
          attack: 0.03,
          decay: 0.1,
          sustain: 0.4,
          release: 0.2,
          baseFrequency: 420,
          octaves: 1.6,
        },
      }).connect(channel);
      noteSeq(["C4", "C4", "D4", "E4", "E4", "D4", "C4", "G3"], "8n", (time, note) => {
        chant.triggerAttackRelease(note, "8n", time);
      });
    }),
  );

  voices.set(
    "mani",
    makeVoice(-13, 0.16, (channel) => {
      const sweet = new Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.05, decay: 0.12, sustain: 0.45, release: 0.2 },
      }).connect(channel);
      noteSeq(["E4", null, "G4", null, "A4", null, "G4", "E4"], "8n", (time, note) => {
        sweet.triggerAttackRelease(note, "8n", time);
      });
    }),
  );
}

export async function unlockAudio(): Promise<void> {
  if (unlocked) return;

  await start();
  const transport = getTransport();
  transport.bpm.value = BPM;
  transport.swing = 0;

  const limiter = new Limiter(-1.5);
  limiter.toDestination();
  getDestination().volume.value = -3;

  const reverb = new Reverb({ decay: 1.7, preDelay: 0.02, wet: 0.2 });
  reverb.connect(limiter);
  await reverb.ready;
  master = reverb;

  buildVoices();

  beatLoop = new Loop((time) => {
    getDraw().schedule(() => {
      beatCount += 1;
      onBeat?.(beatCount);
    }, time);
  }, "4n");
  beatLoop.start(0);

  if (transport.state !== "started") {
    transport.start();
  }

  unlocked = true;
}

export function setMuted(muted: boolean): void {
  getDestination().mute = muted;
}

export function setOnBeat(callback: ((beat: number) => void) | null): void {
  onBeat = callback;
}

export function syncVoices(activeIds: Iterable<CharacterId>): void {
  if (!unlocked) return;
  const active = new Set(activeIds);
  for (const character of CHARACTERS) {
    voices.get(character.id)?.setActive(active.has(character.id));
  }
}

export function isAudioReady(): boolean {
  return unlocked;
}
