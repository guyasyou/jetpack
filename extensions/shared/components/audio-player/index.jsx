/* global _wpmejsSettings, MediaElementPlayer */

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from '../../../store/media-source/constants';
import { pickCurrentTime } from './utils';

/**
 * Style dependencies
 */
import './style.scss';

// MediaElement global settings.
const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

function createJumpButton( containerClass, label, clickHandler ) {
	const buttonContainer = document.createElement( 'div' );
	buttonContainer.className = containerClass;

	const button = document.createElement( 'button' );
	button.innerText = label;
	button.addEventListener( 'click', clickHandler );
	button.setAttribute( 'aria-label', label );
	button.setAttribute( 'title', label );
	buttonContainer.appendChild( button );
	return buttonContainer;
}

function AudioPlayer( {
	trackSource,
	onPlay,
	onPause,
	onError,
	onTimeChange,
	onSkipForward,
	onJumpBack,
	currentTime,
	playStatus = STATE_PAUSED,
} ) {
	const audioRef = useRef();

	/**
	 * Play current audio.
	 *
	 * @public
	 */
	const play = () => {
		// Ignoring exceptions as they are handled globally from the audio element.
		audioRef.current.play().catch( () => {} );
	};

	/**
	 * Pause current audio.
	 *
	 * @public
	 */
	const pause = () => {
		audioRef.current.pause();
		speak( __( 'Paused', 'jetpack' ), 'assertive' );
	};

	useEffect( () => {
		const audio = audioRef.current;
		const mediaElement = new MediaElementPlayer( audio, meJsSettings );

		// Try to catch play event from the media player button.
		const playButton = mediaElement.container?.[ 0 ]?.querySelector( '.mejs-play button' );
		function onPlayButtonHandler( event ) {
			event.preventDefault();
			event.stopPropagation();

			if ( audio?.error ) {
				return onError( audio.error );
			}

			if ( audio?.paused ) {
				return onPlay();
			}

			onPause();
		}

		// Add the skip and jump buttons if needed
		if ( onJumpBack || onSkipForward ) {
			const containerClass = `${ mediaElement.options.classPrefix }button ${ mediaElement.options.classPrefix }jump-button`;

			if ( onJumpBack ) {
				const buttonClass = `${ containerClass } ${ mediaElement.options.classPrefix }jump-backward-button`;
				mediaElement.addControlElement(
					createJumpButton( buttonClass, __( 'Jump Back', 'jetpack' ), onJumpBack ),
					'jumpBackwardButton'
				);
			}

			if ( onSkipForward ) {
				const buttonClass = `${ containerClass } ${ mediaElement.options.classPrefix }skip-forward-button`;
				mediaElement.addControlElement(
					createJumpButton( buttonClass, __( 'Skip Forward', 'jetpack' ), onSkipForward ),
					'skipForwardButton'
				);
			}
		}
		onPlay && audio.addEventListener( 'play', onPlay );
		onPause && audio.addEventListener( 'pause', onPause );
		onError && audio.addEventListener( 'error', onError );
		playButton && playButton.addEventListener( 'click', onPlayButtonHandler );

		return () => {
			// Cleanup.
			mediaElement.remove();
			onPlay && audio.removeEventListener( 'play', onPlay );
			onPause && audio.removeEventListener( 'pause', onPause );
			onError && audio.removeEventListener( 'error', onError );
			playButton && playButton.removeEventListener( 'click', onPlayButtonHandler );
		};
	}, [ audioRef, onPlay, onPause, onError, onJumpBack, onSkipForward ] );

	/*
	 * `playStatus` property handleing.
	 */
	useEffect( () => {
		// Get the current status of the audio element and the required action to toggle it.
		const [ audioStatus, action ] = audioRef.current?.paused === false
			? [ STATE_PLAYING, pause ]
			: [ STATE_PAUSED, play ];

		if ( STATE_ERROR !== playStatus && audioStatus !== playStatus ) {
			action();
		}
	}, [ audioRef, playStatus ] );

	/*
	 * Handle onTimeChange() event
	 */
	useEffect( () => {
		if ( ! onTimeChange ) {
			return;
		}

		// Add time change event listener
		const audio = audioRef.current;
		function onTimeUpdate( event ) {
			// bail early if the current time
			// defined by the prop has been already udated.
			if (
				typeof currentTime === 'number' &&
				event.target.currentTime === currentTime
			) {
				return;
			}

			onTimeChange( event.target.currentTime );
		}

		onTimeChange && audio?.addEventListener( 'timeupdate', onTimeUpdate );

		return () => {
			audio?.removeEventListener( 'timeupdate', onTimeUpdate );
		};
	}, [ audioRef, onTimeChange, currentTime ] );

	/*
	 * `currentTime` property handling
	 * The audio current time is defined by the `currentTime` property.
	 * It's important to keep in mind that its value can be a string,
	 * which in that case will contain action-meta-information beside the time value.
	 * In order to avoid usage mistakes,
	 * it's strongly encouraged to use the helpoer functions,
	 * defined in the ./utils file
	 */
	useEffect( () => {
		// If there's no audio component,
		// or we're not controlling time with the `currentTime` and `reportedTime` prop,
		// then bail early.
		const audio = audioRef.current;

		if ( typeof currentTime === 'number' ) {
			return;
		}

		// Pick value and action using helper funtion.
		const [ value, action ] = pickCurrentTime( currentTime );

		// If there is not an audio player, or if the current time is a number, bail early.
		if ( ! audio || typeof value !== 'number' ) {
			return;
		}

		// Set the new current time according to value and action.
		const newCurrentTime = value + (
			action === 'offset' ? audio.currentTime : 0
		);

		// Bail early if there are no changes in the current time.
		if ( newCurrentTime === audio.currentTime ) {
			return;
		}

		audio.currentTime = newCurrentTime;
		onTimeChange && onTimeChange( audio.currentTime );
	}, [ audioRef, currentTime, onTimeChange ] );
	return (
		<div className="jetpack-audio-player">
			{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
			<audio src={ trackSource } ref={ audioRef }></audio>
		</div>
	);
}

export default AudioPlayer;