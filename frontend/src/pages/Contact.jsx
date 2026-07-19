import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = { name: "", email: "", phone: "", message: "" };

export default function Contact() {
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const validate = (v) => {
        const e = {};
        if (!v.name.trim()) e.name = "A name is required.";
        if (!v.email.trim()) e.email = "An email is required.";
        else if (!EMAIL_RE.test(v.email)) e.email = "Email is not valid.";
        if (!v.phone.trim()) e.phone = "A phone number is required.";
        if (!v.message.trim()) e.message = "A message is required.";
        return e;
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setValues((prev) => ({ ...prev, [id]: value }));
        // Clear the field error as the user corrects it.
        setErrors((prev) => ({ ...prev, [id]: undefined }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const found = validate(values);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        // No backend in this template — simulate a successful submission.
        setSubmitted(true);
        setValues(EMPTY);
    };

    const fieldClass = (field) =>
        `form-control${errors[field] ? " is-invalid" : ""}`;

    return (
        <main className="flex-shrink-0">
            <section className="py-5">
                <div className="container px-5">
                    {/* Contact form*/}
                    <div className="bg-light rounded-3 py-5 px-4 px-md-5 mb-5">
                        <div className="text-center mb-5">
                            <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                <i className="bi bi-envelope" />
                            </div>
                            <h1 className="fw-bolder">Get in touch</h1>
                            <p className="lead fw-normal text-muted mb-0">
                                We'd love to hear from you
                            </p>
                        </div>
                        <div className="row gx-5 justify-content-center">
                            <div className="col-lg-8 col-xl-6">
                                {submitted && (
                                    <div
                                        className="alert alert-success d-flex align-items-center"
                                        role="alert"
                                    >
                                        <i className="bi bi-check-circle-fill me-2" />
                                        <div>
                                            Thanks! Your message has been sent. We'll get back
                                            to you shortly.
                                        </div>
                                    </div>
                                )}
                                <form id="contactForm" noValidate onSubmit={handleSubmit}>
                                    {/* Name input*/}
                                    <div className="form-floating mb-3">
                                        <input
                                            className={fieldClass("name")}
                                            id="name"
                                            type="text"
                                            placeholder="Enter your name..."
                                            value={values.name}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="name">Full name</label>
                                        {errors.name && (
                                            <div className="invalid-feedback">{errors.name}</div>
                                        )}
                                    </div>
                                    {/* Email address input*/}
                                    <div className="form-floating mb-3">
                                        <input
                                            className={fieldClass("email")}
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={values.email}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="email">Email address</label>
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email}</div>
                                        )}
                                    </div>
                                    {/* Phone number input*/}
                                    <div className="form-floating mb-3">
                                        <input
                                            className={fieldClass("phone")}
                                            id="phone"
                                            type="tel"
                                            placeholder="(123) 456-7890"
                                            value={values.phone}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="phone">Phone number</label>
                                        {errors.phone && (
                                            <div className="invalid-feedback">{errors.phone}</div>
                                        )}
                                    </div>
                                    {/* Message input*/}
                                    <div className="form-floating mb-3">
                                        <textarea
                                            className={fieldClass("message")}
                                            id="message"
                                            placeholder="Enter your message here..."
                                            style={{ height: "10rem" }}
                                            value={values.message}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="message">Message</label>
                                        {errors.message && (
                                            <div className="invalid-feedback">{errors.message}</div>
                                        )}
                                    </div>
                                    {/* Submit Button*/}
                                    <div className="d-grid">
                                        <button
                                            className="btn btn-primary btn-lg"
                                            id="submitButton"
                                            type="submit"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    {/* Contact cards*/}
                    <div className="row gx-5 row-cols-2 row-cols-lg-4 py-5">
                        <div className="col">
                            <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                <i className="bi bi-chat-dots" />
                            </div>
                            <div className="h5 mb-2">Chat with us</div>
                            <p className="text-muted mb-0">
                                Chat live with one of our support specialists.
                            </p>
                        </div>
                        <div className="col">
                            <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                <i className="bi bi-people" />
                            </div>
                            <div className="h5">Ask the community</div>
                            <p className="text-muted mb-0">
                                Explore our community forums and communicate with other users.
                            </p>
                        </div>
                        <div className="col">
                            <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                <i className="bi bi-question-circle" />
                            </div>
                            <div className="h5">Support center</div>
                            <p className="text-muted mb-0">
                                Browse FAQ's and support articles to find solutions.
                            </p>
                        </div>
                        <div className="col">
                            <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                                <i className="bi bi-telephone" />
                            </div>
                            <div className="h5">Call us</div>
                            <p className="text-muted mb-0">
                                Call us during normal business hours at (555) 892-9403.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
