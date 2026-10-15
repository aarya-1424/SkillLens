// Reference video mapping for each sport - using available videos
const sportReferenceVideos = {
    'Basketball': '/videos/ref1.mp4',
    'Soccer': '/videos/ref2.mp4',
    'Tennis': '/videos/ref3.mp4',
    'Baseball': '/videos/ref4.mp4',
    'Volleyball': '/videos/ref5.mp4',
    'Swimming': '/videos/ref6.mp4',
    'Running': '/videos/ref7.mp4',
    'Cycling': '/videos/ref8.mp4',
    'Cricket': '/videos/ref1.mp4', // Using ref1 as placeholder for Cricket
};
// AI-based feedback generation with movement error detection
const generateAIFeedback = async (deviations, sport) => {
    console.log(`Generating AI feedback for ${sport} with deviations:`, deviations);
    const feedback = [];
    const errors = [];
    // Detect specific movement errors based on deviations
    if (deviations.shoulder > 15) {
        errors.push('Excessive shoulder rotation detected');
        feedback.push(`Your shoulder is over-rotating by ${Math.round(deviations.shoulder)}°. This can strain your rotator cuff. Focus on keeping your shoulder stable and aligned with your torso.`);
    }
    else if (deviations.shoulder > 10) {
        errors.push('Moderate shoulder misalignment');
        feedback.push('Your shoulder alignment needs improvement. Practice controlled movements to build stability.');
    }
    if (deviations.elbow > 12) {
        errors.push('Improper elbow extension');
        feedback.push(`Elbow extension is ${Math.round(deviations.elbow)}° off the ideal form. This reduces power transfer and may cause tennis elbow over time.`);
    }
    else if (deviations.elbow < -5) {
        feedback.push('Excellent elbow extension! This gives you optimal power. Maintain this form.');
    }
    if (deviations.hip > 12) {
        errors.push('Hip rotation imbalance');
        feedback.push(`Excessive hip rotation detected (${Math.round(deviations.hip)}°). Engage your core more actively to prevent lower back strain and improve stability.`);
    }
    if (deviations.spine > 15) {
        errors.push('Spinal misalignment - high injury risk');
        feedback.push(`Your spine curvature is ${Math.round(deviations.spine)}° beyond safe limits. This significantly increases risk of back injury. Focus on maintaining a neutral spine position.`);
    }
    else if (deviations.spine > 8) {
        errors.push('Minor spinal deviation');
        feedback.push('Your spine shows slight deviation. Core strengthening exercises will help maintain proper alignment.');
    }
    // Sport-specific feedback
    if (sport === 'Basketball' && deviations.hip > 10) {
        feedback.push('For basketball, improve your jump landing technique by keeping hips aligned to prevent knee injuries.');
    }
    else if (sport === 'Tennis' && deviations.shoulder > 10) {
        feedback.push('Tennis requires precise shoulder control. Work on your serve mechanics to prevent shoulder injuries.');
    }
    else if (sport === 'Running' && deviations.spine > 10) {
        feedback.push('Running form: maintain an upright posture to reduce impact stress on your spine.');
    }
    else if (sport === 'Cricket' && deviations.shoulder > 10) {
        feedback.push('Cricket batting/bowling: maintain stable shoulder rotation to prevent rotator cuff injuries and improve shot power.');
    }
    // Motivational feedback based on performance level
    const totalDeviation = Object.values(deviations).reduce((sum, d) => sum + Math.abs(d), 0);
    const avgDeviation = totalDeviation / Object.keys(deviations).length;
    if (Object.values(deviations).every(d => Math.abs(d) < 8)) {
        feedback.push(`🌟 Exceptional form for ${sport}! Your movements are controlled, stable, and precise.`);
        feedback.push('💪 Your kinetic chain is well-aligned, leading to efficient power transfer and minimal injury risk. Keep up the outstanding work!');
    }
    else if (avgDeviation < 12) {
        feedback.push(`✅ Good overall form! You're on the right track. Focus on the specific corrections mentioned above to reach elite level.`);
    }
    else if (avgDeviation < 18) {
        feedback.push(`📈 You have solid potential! Work on the identified weaknesses, and you'll see significant improvement in just a few weeks.`);
    }
    else {
        feedback.push(`💡 Don't be discouraged! Everyone starts somewhere. Focus on correcting one movement at a time, and you'll build proper muscle memory.`);
        feedback.push(`🎯 Recommendation: Work with a coach or watch tutorial videos for your specific areas of concern. Progress takes time and dedication!`);
    }
    return new Promise(resolve => setTimeout(() => resolve({
        feedback: feedback.slice(0, 5),
        errors
    }), 500));
};
// AI-based injury risk assessment using detected movement errors
const generateInjuryRisk = async (scores, errors, userFitness) => {
    const scorePercentages = {
        shoulder: scores.shoulder.score / scores.shoulder.max,
        elbow: scores.elbow.score / scores.elbow.max,
        hip: scores.hip.score / scores.hip.max,
        spine: scores.spine.score / scores.spine.max,
    };
    const minScore = Math.min(...Object.values(scorePercentages));
    const maxScore = Math.max(...Object.values(scorePercentages));
    const risks = [];
    // Risk assessment based on detected errors
    if (errors.includes('Spinal misalignment - high injury risk')) {
        risks.push('High risk of lumbar strain or herniated disc');
        risks.push('Potential for chronic lower back pain');
    }
    if (errors.includes('Excessive shoulder rotation detected')) {
        risks.push('Rotator cuff tear risk');
        risks.push('Shoulder impingement syndrome');
    }
    if (errors.includes('Hip rotation imbalance')) {
        risks.push('Lower back compensation injury');
        risks.push('Hip flexor strain');
    }
    if (errors.includes('Improper elbow extension')) {
        risks.push('Tennis elbow (lateral epicondylitis)');
        risks.push('Reduced joint longevity');
    }
    // Consider previous injuries
    if (userFitness.previousInjuries && userFitness.previousInjuries.trim() !== '') {
        risks.push(`Re-injury risk in previously affected areas: ${userFitness.previousInjuries.substring(0, 50)}...`);
    }
    // Age-based risk factors
    if (userFitness.age > 40) {
        risks.push('Age-related recovery time may be extended');
    }
    // Determine risk level
    if (errors.length >= 3 || scorePercentages.spine < 0.5 || maxScore - minScore > 0.5) {
        return {
            level: 'High',
            details: `Critical form issues detected. ${errors.length} major movement errors identified that significantly increase injury risk. Immediate correction recommended before continuing training.`,
            risks: risks.slice(0, 4)
        };
    }
    if (errors.length >= 1 || scorePercentages.spine < 0.65 || minScore < 0.6) {
        return {
            level: 'Medium',
            details: `${errors.length} movement error(s) detected. While manageable, these issues should be addressed to prevent long-term injury. Focus on correcting identified weaknesses.`,
            risks: risks.slice(0, 3)
        };
    }
    if (risks.length === 0) {
        risks.push('Excellent form minimizes injury risk');
        risks.push('Continue proper warm-up and cool-down routines');
    }
    return {
        level: 'Low',
        details: 'Your form is well-balanced and stable. Movement patterns show minimal injury risk. Continue with consistent training and proper warm-ups.',
        risks: risks.slice(0, 2)
    };
};
// AI-generated personalized training plan based on sport, experience, and fitness data
const generateTrainingPlan = async (userFitness, scores) => {
    const { sport, sportExperience, stamina, age, weight, height } = userFitness;
    const bmi = weight / ((height / 100) ** 2);
    const schedule = [];
    const diet = [];
    // Experience-based training intensity
    const intensityMap = {
        'beginner': { sessions: 3, restDays: 4, intensity: 'Low to Moderate' },
        'intermediate': { sessions: 4, restDays: 3, intensity: 'Moderate to High' },
        'advanced': { sessions: 5, restDays: 2, intensity: 'High Intensity' }
    };
    const plan = intensityMap[sportExperience];
    // Sport-specific training schedule
    if (sport === 'Basketball') {
        schedule.push(`Monday: ${plan.intensity} Basketball Drills & Shooting Practice (60-90 min)`);
        schedule.push('Tuesday: Lower Body Strength Training - Squats, Lunges, Box Jumps');
        schedule.push('Wednesday: Cardio & Agility - Ladder Drills, Cone Exercises');
        if (sportExperience !== 'beginner') {
            schedule.push('Thursday: Full Court Scrimmage & Game Scenarios');
        }
        schedule.push('Friday: Core & Upper Body - Planks, Medicine Ball Throws');
        if (sportExperience === 'advanced') {
            schedule.push('Saturday: High-Intensity Interval Training (HIIT) & Plyometrics');
        }
        schedule.push('Sunday: Active Recovery - Light Stretching, Yoga');
    }
    else if (sport === 'Soccer') {
        schedule.push(`Monday: ${plan.intensity} Soccer Skills - Dribbling, Passing (60-90 min)`);
        schedule.push('Tuesday: Endurance Running - 5-8 km at moderate pace');
        schedule.push('Wednesday: Lower Body & Core Strength');
        if (sportExperience !== 'beginner') {
            schedule.push('Thursday: Match Play & Tactical Training');
        }
        schedule.push('Friday: Sprint Intervals & Agility Work');
        if (sportExperience === 'advanced') {
            schedule.push('Saturday: Position-Specific Drills & Conditioning');
        }
        schedule.push('Sunday: Rest or Light Recovery Run');
    }
    else if (sport === 'Tennis') {
        schedule.push(`Monday: ${plan.intensity} Tennis Technique - Serve, Groundstrokes`);
        schedule.push('Tuesday: Upper Body & Core Strength Training');
        schedule.push('Wednesday: Footwork & Agility Drills');
        schedule.push('Thursday: Match Play & Strategy');
        schedule.push('Friday: Explosive Power - Medicine Ball, Resistance Bands');
        if (sportExperience === 'advanced') {
            schedule.push('Saturday: Advanced Tactics & Conditioning');
        }
        schedule.push('Sunday: Rest & Foam Rolling');
    }
    else if (sport === 'Running') {
        schedule.push(`Monday: Easy Run - ${sportExperience === 'beginner' ? '3-5 km' : sportExperience === 'intermediate' ? '6-8 km' : '8-12 km'}`);
        schedule.push('Tuesday: Strength Training - Legs & Core');
        schedule.push('Wednesday: Tempo Run or Intervals');
        schedule.push('Thursday: Cross-Training - Cycling or Swimming');
        schedule.push('Friday: Easy Recovery Run');
        if (sportExperience === 'advanced') {
            schedule.push('Saturday: Long Run - 15-20 km');
        }
        else {
            schedule.push('Saturday: Moderate Distance Run');
        }
        schedule.push('Sunday: Rest or Active Stretching');
    }
    else if (sport === 'Cricket') {
        schedule.push(`Monday: ${plan.intensity} Batting Practice - Technique & Shot Selection`);
        schedule.push('Tuesday: Bowling Drills & Fielding Practice');
        schedule.push('Wednesday: Strength Training - Legs, Core & Shoulders');
        if (sportExperience !== 'beginner') {
            schedule.push('Thursday: Match Simulation - Batting & Bowling');
        }
        schedule.push('Friday: Agility & Quick Reflexes Training');
        if (sportExperience === 'advanced') {
            schedule.push('Saturday: Power Hitting & Spin Bowling Practice');
        }
        schedule.push('Sunday: Rest & Stretching - Focus on Shoulder & Wrist Recovery');
    }
    else {
        // Generic schedule for other sports
        schedule.push(`Monday: ${plan.intensity} Sport-Specific Skills Training`);
        schedule.push('Tuesday: Strength & Conditioning');
        schedule.push('Wednesday: Cardio & Endurance Work');
        schedule.push('Thursday: Technical Practice');
        schedule.push('Friday: Power & Explosiveness Training');
        if (sportExperience === 'advanced') {
            schedule.push('Saturday: Competition Simulation');
        }
        schedule.push('Sunday: Rest & Recovery');
    }
    // Personalized diet based on fitness data
    const calorieNeeds = sportExperience === 'advanced' ? 'high' : sportExperience === 'intermediate' ? 'moderate' : 'standard';
    diet.push(`Prioritize lean protein (chicken, fish, tofu, eggs) - ${sportExperience === 'advanced' ? '2.0g' : '1.6g'}/kg body weight for muscle repair and growth.`);
    if (stamina === 'low') {
        diet.push('Focus on complex carbohydrates (oats, quinoa, sweet potato) to build energy reserves. Eat 4-5 small meals throughout the day.');
    }
    else {
        diet.push(`Complex carbohydrates (brown rice, whole grain pasta) for sustained energy - ${calorieNeeds === 'high' ? '5-7g' : '4-5g'}/kg body weight.`);
    }
    diet.push(`Stay hydrated: Drink at least ${age > 40 ? '3-3.5' : '3.5-4'} liters of water daily, more during training.`);
    diet.push('Include healthy fats (avocado, nuts, olive oil, fatty fish) for joint health and hormone production.');
    if (bmi > 25) {
        diet.push('Consider portion control and increase vegetable intake to support weight management while maintaining performance.');
    }
    if (sport === 'Basketball' || sport === 'Volleyball') {
        diet.push('Calcium and Vitamin D rich foods (dairy, fortified alternatives) to support bone health for jumping sports.');
    }
    if (age > 35) {
        diet.push('Include anti-inflammatory foods (berries, turmeric, ginger) to aid recovery and joint health.');
    }
    // Add recovery recommendations based on weak joints
    const weakJoint = Object.entries(scores).reduce((min, [joint, score]) => score.score / score.max < min.ratio ? { joint, ratio: score.score / score.max } : min, { joint: '', ratio: 1 });
    if (weakJoint.ratio < 0.7) {
        diet.push(`Targeted nutrition for ${weakJoint.joint} recovery: collagen peptides and omega-3 supplements may help strengthen this area.`);
    }
    return { schedule, diet };
};
export const analyzeVideo = async (videoFile, userFitness) => {
    if (!videoFile) {
        throw new Error("No video file provided for analysis.");
    }
    console.log('Starting AI-powered video analysis...');
    console.log('User fitness data:', userFitness);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 4000));
    // Simulate pose detection and comparison with reference video
    // In production, this would use MediaPipe or TensorFlow.js for pose estimation
    const deviations = {
        shoulder: Math.random() * 25 - 5,
        elbow: Math.random() * 20 - 8,
        hip: Math.random() * 20 - 3,
        spine: Math.random() * 22 - 2,
    };
    console.log('Detected joint angle deviations:', deviations);
    const calculateScore = (deviation, maxDeviation, maxScore) => {
        return Math.max(0, Math.round(maxScore - (Math.abs(deviation) / maxDeviation) * maxScore));
    };
    const shoulderScore = { score: calculateScore(deviations.shoulder, 25, 30), max: 30 };
    const elbowScore = { score: calculateScore(deviations.elbow, 25, 25), max: 25 };
    const hipScore = { score: calculateScore(deviations.hip, 25, 25), max: 25 };
    const spineScore = { score: calculateScore(deviations.spine, 25, 20), max: 20 };
    const jointScores = { shoulder: shoulderScore, elbow: elbowScore, hip: hipScore, spine: spineScore };
    const totalScore = Object.values(jointScores).reduce((sum, s) => sum + s.score, 0);
    // Generate AI-powered insights based on actual analysis
    const { feedback: aiFeedback, errors: detectedErrors } = await generateAIFeedback(deviations, userFitness.sport);
    const injuryRisk = await generateInjuryRisk(jointScores, detectedErrors, userFitness);
    const trainingPlan = await generateTrainingPlan(userFitness, jointScores);
    // Calculate fitness potential based on current performance and user data
    const ageFactor = Math.max(0.7, 1 - (Math.abs(userFitness.age - 25) / 100));
    const experienceFactor = userFitness.sportExperience === 'advanced' ? 1.1 : userFitness.sportExperience === 'intermediate' ? 1.0 : 0.85;
    const staminaFactor = userFitness.stamina === 'high' ? 1.1 : userFitness.stamina === 'medium' ? 1.0 : 0.9;
    const fitnessPotential = Math.min(100, Math.round(totalScore * ageFactor * experienceFactor * staminaFactor * 0.85));
    // Select the appropriate reference video for the user's sport
    const selectedReferenceVideo = sportReferenceVideos[userFitness.sport] || '/videos/ref1.mp4';
    console.log('Analysis complete. Total score:', totalScore, 'Fitness potential:', fitnessPotential);
    return {
        totalScore,
        fitnessPotential,
        jointScores,
        feedback: aiFeedback,
        injuryRisk,
        trainingPlan,
        referenceVideoUrls: [
            '/videos/ref1.mp4',
            '/videos/ref2.mp4',
            '/videos/ref3.mp4',
            '/videos/ref4.mp4',
            '/videos/ref5.mp4',
            '/videos/ref6.mp4',
            '/videos/ref7.mp4',
            '/videos/ref8.mp4',
        ],
        selectedReferenceVideo,
        detectedMovementErrors: detectedErrors,
    };
};
export const getInitialProgressData = () => {
    return [
        { date: 'Jul 1', total_score: 65, shoulder_score: 18, elbow_score: 15, hip_score: 17, spine_score: 15 },
        { date: 'Jul 8', total_score: 72, shoulder_score: 22, elbow_score: 18, hip_score: 18, spine_score: 14 },
        { date: 'Jul 15', total_score: 78, shoulder_score: 24, elbow_score: 20, hip_score: 20, spine_score: 14 },
        { date: 'Jul 22', total_score: 85, shoulder_score: 26, elbow_score: 22, hip_score: 22, spine_score: 15 },
    ];
};
