import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import MotionPathPlugin from "gsap/MotionPathPlugin";

let registered = false;

export function registerGSAP() {
  if (registered) return gsap;
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  registered = true;
  return gsap;
}

export default gsap;
