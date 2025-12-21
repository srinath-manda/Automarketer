/**
 * Social Media Publishing Utilities
 * Provides platform-specific URLs and handlers for posting content
 */

export const socialShare = {
    /**
     * Share to Twitter/X
     */
    twitter: (content, imageUrl) => {
        // Copy content first as backup
        navigator.clipboard.writeText(content);

        const text = encodeURIComponent(content.substring(0, 280)); // Twitter limit
        // Use x.com (new Twitter domain) with simpler intent
        const url = `https://x.com/intent/post?text=${text}`;
        const popup = window.open(url, '_blank', 'width=550,height=520');

        // If popup blocked, show instructions
        if (!popup) {
            alert('✅ Content copied to clipboard!\n\nPopup was blocked. Please:\n1. Open x.com/twitter.com\n2. Click "Post"\n3. Paste your content');
        }
    },

    /**
     * Share to LinkedIn
     */
    linkedin: (content, imageUrl) => {
        // Copy content first
        navigator.clipboard.writeText(content);

        // Open LinkedIn share
        const url = `https://www.linkedin.com/feed/?shareActive=true`;
        window.open(url, '_blank', 'width=600,height=600');

        alert('✅ Content copied to clipboard!\n\nLinkedIn is opening. Click "Start a post" and paste your content.');
    },

    /**
     * Instagram - Opens Instagram web and copies content
     */
    instagram: (content, imageUrl) => {
        // Copy content to clipboard
        navigator.clipboard.writeText(content);

        // Download the image if available
        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = 'instagram_post.jpg';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Open Instagram
        window.open('https://www.instagram.com/', '_blank');

        alert('✅ Caption copied & Image downloading!\n\n📱 Steps:\n1. Open Instagram app\n2. Create new post\n3. Upload the downloaded image\n4. Paste the caption');
    },

    /**
     * Email - Opens default email client with pre-filled content
     */
    email: (content, imageUrl, subject = 'Marketing Campaign') => {
        const body = encodeURIComponent(content + (imageUrl ? `\n\nImage: ${imageUrl}` : ''));
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
        window.location.href = mailtoUrl;
    },

    /**
     * Blog - Opens WordPress or provides copy functionality
     */
    blog: (content, imageUrl) => {
        const markdownContent = imageUrl ?
            `${content}\n\n![Featured Image](${imageUrl})` :
            content;

        navigator.clipboard.writeText(markdownContent);
        window.open('https://wordpress.com/post', '_blank');

        alert('✅ Blog content copied!\n\nWordPress is opening. Paste your content in the editor.');
    },

    /**
     * Generic share function that routes to the appropriate platform
     */
    shareTo: (platform, content, imageUrl) => {
        const p = platform.toLowerCase().trim();

        console.log('Sharing to platform:', p); // Debug log

        if (p.includes('twitter') || p === 'x') {
            socialShare.twitter(content, imageUrl);
        } else if (p.includes('linkedin')) {
            socialShare.linkedin(content, imageUrl);
        } else if (p.includes('instagram')) {
            socialShare.instagram(content, imageUrl);
        } else if (p.includes('email')) {
            socialShare.email(content, imageUrl);
        } else if (p.includes('blog')) {
            socialShare.blog(content, imageUrl);
        } else {
            // Generic - copy and show message
            navigator.clipboard.writeText(content);
            alert(`✅ Content copied to clipboard!\n\nYou can now paste it on ${platform}.`);
        }
    }
};

export default socialShare;
