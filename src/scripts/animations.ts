import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animaciones del sitio. Se controlan con atributos data-* en el HTML:
 *  data-anim="up"        aparece subiendo al entrar en pantalla
 *  data-anim="clip"      imagen que se descubre con una máscara
 *  data-anim="words"     texto que se "enciende" palabra por palabra con el scroll
 *  data-anim-stagger     contenedor cuyos hijos [data-anim="up"] entran escalonados
 *  data-parallax="0.15"  desplazamiento vertical suave con el scroll
 *  data-magnetic         botón que sigue levemente al cursor
 *  data-hero             timeline de entrada de la portada
 *  data-rotator          palabras que rotan (hijos [data-word])
 *  data-marquee          cinta infinita que cambia de dirección con el scroll
 *  data-grow             bloque que crece al entrar (CTA)
 *  data-spin             gira continuamente
 */

let ctx: gsap.Context | null = null;
let cleanups: Array<() => void> = [];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showAll() {
	gsap.set('[data-anim]', { clearProps: 'all', opacity: 1 });
	document.querySelectorAll<HTMLElement>('[data-anim="words"] .word').forEach((w) => (w.style.opacity = '1'));
}

function splitWords(el: HTMLElement) {
	if (el.dataset.split) return;
	el.dataset.split = 'true';
	const words = (el.textContent || '').trim().split(/\s+/);
	el.innerHTML = words.map((w) => `<span class="word inline-block">${w}</span>`).join(' ');
}

function hero() {
	const root = document.querySelector<HTMLElement>('[data-hero]');
	if (!root) return;
	const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } });
	tl.to(root, { opacity: 1, duration: 0.01 })
		.from(root.querySelectorAll('[data-hero-line] > span'), { yPercent: 110, stagger: 0.09 })
		.from(root.querySelectorAll('[data-hero-fade]'), { opacity: 0, y: 24, stagger: 0.08, duration: 0.9 }, '-=0.8')
		.fromTo(root.querySelectorAll('[data-hero-img]'), {
			clipPath: 'inset(100% 0% 0% 0% round 1.25rem)'
		}, {
			clipPath: 'inset(0% 0% 0% 0% round 1.25rem)',
			stagger: 0.15,
			duration: 1.4,
			ease: 'expo.inOut'
		}, 0.2)
		.from(root.querySelectorAll('[data-hero-img] img'), { scale: 1.35, stagger: 0.15, duration: 1.8 }, 0.2)
		.from(root.querySelectorAll('[data-hero-pop]'), { scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.6)' }, '-=0.9');

	// Movimiento sutil de las fotos siguiendo al mouse
	const layers = root.querySelectorAll<HTMLElement>('[data-depth]');
	if (layers.length && window.matchMedia('(pointer: fine)').matches) {
		const onMove = (e: MouseEvent) => {
			const x = e.clientX / window.innerWidth - 0.5;
			const y = e.clientY / window.innerHeight - 0.5;
			layers.forEach((l) => {
				const d = Number(l.dataset.depth || 10);
				gsap.to(l, { x: x * d, y: y * d, duration: 1.2, ease: 'power3.out' });
			});
		};
		window.addEventListener('mousemove', onMove);
		cleanups.push(() => window.removeEventListener('mousemove', onMove));
	}
}

function rotators() {
	document.querySelectorAll<HTMLElement>('[data-rotator]').forEach((rot) => {
		const words = Array.from(rot.querySelectorAll<HTMLElement>('[data-word]'));
		if (words.length < 2) return;
		gsap.set(words, { yPercent: 110, opacity: 0 });
		gsap.set(words[0], { yPercent: 0, opacity: 1 });
		const tl = gsap.timeline({ repeat: -1, delay: 2 });
		words.forEach((word, i) => {
			const next = words[(i + 1) % words.length];
			tl.to(word, { yPercent: -110, opacity: 0, duration: 0.7, ease: 'expo.inOut' }, `+=${i === 0 ? 0 : 1.8}`)
				.fromTo(next, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.inOut' }, '<');
		});
	});
}

function marquees() {
	document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((track) => {
		const tween = gsap.to(track, { xPercent: -50, duration: 35, ease: 'none', repeat: -1 });
		let direction = 1;
		const st = ScrollTrigger.create({
			onUpdate: (self) => {
				if (self.direction !== direction) {
					direction = self.direction;
					gsap.to(tween, { timeScale: direction, duration: 0.6, overwrite: true });
				}
				// acelera un poco al scrollear rápido
				const boost = gsap.utils.clamp(1, 4, Math.abs(self.getVelocity()) / 400);
				gsap.to(tween, { timeScale: direction * boost, duration: 0.3, overwrite: true });
				gsap.to(tween, { timeScale: direction, duration: 1, delay: 0.3 });
			}
		});
		cleanups.push(() => st.kill());
	});
}

function reveals() {
	// Grupos escalonados
	document.querySelectorAll<HTMLElement>('[data-anim-stagger]').forEach((group) => {
		const items = group.querySelectorAll<HTMLElement>(':scope [data-anim="up"]');
		gsap.fromTo(items, { opacity: 0, y: 60 }, {
			opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12,
			scrollTrigger: { trigger: group, start: 'top 82%' }
		});
		items.forEach((i) => (i.dataset.done = 'true'));
	});

	gsap.utils.toArray<HTMLElement>('[data-anim="up"]:not([data-done])').forEach((el) => {
		gsap.fromTo(el, { opacity: 0, y: 50 }, {
			opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
			scrollTrigger: { trigger: el, start: 'top 88%' }
		});
	});

	gsap.utils.toArray<HTMLElement>('[data-anim="clip"]').forEach((el) => {
		const img = el.querySelector('img');
		const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
		tl.fromTo(el, { opacity: 1, clipPath: 'inset(15% 15% 15% 15% round 2rem)' }, { clipPath: 'inset(0% 0% 0% 0% round 1.25rem)', duration: 1.4, ease: 'expo.out' });
		if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
	});

	gsap.utils.toArray<HTMLElement>('[data-anim="words"]').forEach((el) => {
		splitWords(el);
		gsap.set(el, { opacity: 1 });
		gsap.fromTo(el.querySelectorAll('.word'), { opacity: 0.12 }, {
			opacity: 1, stagger: 0.1, ease: 'none',
			scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
		});
	});

	gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
		const amount = Number(el.dataset.parallax || 0.15) * 100;
		gsap.fromTo(el, { yPercent: -amount / 2 }, {
			yPercent: amount / 2, ease: 'none',
			scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true }
		});
	});

	gsap.utils.toArray<HTMLElement>('[data-grow]').forEach((el) => {
		gsap.fromTo(el, { scale: 0.88, opacity: 1 }, {
			scale: 1, ease: 'none',
			scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: true }
		});
	});

	gsap.utils.toArray<HTMLElement>('[data-spin]').forEach((el) => {
		gsap.to(el, { rotate: 360, duration: Number(el.dataset.spin || 18), ease: 'none', repeat: -1 });
	});
}

function magnetic() {
	if (!window.matchMedia('(pointer: fine)').matches) return;
	document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
		const move = (e: MouseEvent) => {
			const r = el.getBoundingClientRect();
			gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: 'power3.out' });
		};
		const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
		el.addEventListener('mousemove', move);
		el.addEventListener('mouseleave', leave);
		cleanups.push(() => {
			el.removeEventListener('mousemove', move);
			el.removeEventListener('mouseleave', leave);
		});
	});
}

function init() {
	if (reduced()) {
		showAll();
		return;
	}
	ctx = gsap.context(() => {
		hero();
		rotators();
		marquees();
		reveals();
		magnetic();
	});
	// recalcular cuando cargan imágenes/fuentes
	window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

function destroy() {
	cleanups.forEach((fn) => fn());
	cleanups = [];
	ctx?.revert();
	ctx = null;
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
