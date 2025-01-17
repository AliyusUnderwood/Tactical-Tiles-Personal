/** @format */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const LandingPage = () => {
	const containerRef = useRef(null);
	const titleRef = useRef(null);
	const buttonsRef = useRef([]);

	useEffect(() => {
		const tl = gsap.timeline();

		tl.fromTo(
			containerRef.current,
			{ opacity: 1 },
			{ opacity: 1, duration: 0.5 }
		)
			.fromTo(
				titleRef.current,
				{ y: -50, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.8 },
				'-=0.3'
			)
			.fromTo(
				buttonsRef.current,
				{
					x: -50,
					opacity: 0,
				},
				{
					x: 0,
					opacity: 1,
					stagger: 0.2,
					duration: 0.5,
				},
				'-=0.5'
			);
	}, []);

	return (
		<div
			ref={containerRef}
			className='landing-page flex flex-col justify-center items-center h-screen w-screen bg-gray-800 text-white'>
			<h1 ref={titleRef} className='text-4xl font-bold font-montserrat mb-8'>
			Tactical Tiles
			</h1>
			<div className='flex flex-col space-y-4'>
				<Link
					to='/login'
					ref={(el) => (buttonsRef.current[0] = el)}
					className='button px-6 py-2 text-lg rounded transition duration-300 bg-blue-500 hover:bg-blue-600'>
					Login
				</Link>
				<Link
					to='/signup'
					ref={(el) => (buttonsRef.current[1] = el)}
					className='button px-6 py-2 text-lg rounded transition duration-300 bg-green-500 hover:bg-green-600'>
					Sign Up
				</Link>
			</div>
		</div>
	);
};

export default LandingPage;
