import React from "react";

export default function Plan() {
  return (
    <div style={styles.page}>
      {/* TITLE */}
      <h1 style={styles.title}>Choose a Plan</h1>
      <p style={styles.subtitle}>
        Select the RK Dail plan and boost your business visibility.
      </p>


      <div style={styles.planRow}>


        <div style={styles.cardSilver}>
          <div style={styles.badgeSilver}>Silver</div>

          <h2 style={styles.planName}>Silver Plan</h2>
          <p style={styles.planType}>Basic Monthly Listing</p>

          <h1 style={styles.priceSilver}>
            ₹200 <span style={styles.priceMonth}>/month</span>
          </h1>


          <button style={styles.startSilver}>Choose Silver</button>
          <div style={styles.dividerSilver}></div>

          <h3 style={styles.includesTitle}>Includes:</h3>
            <p style={styles.dayPriceSilver}>₹6.6 / day</p>
          <ul style={styles.featuresListSilver}>

            <li style={styles.featureItem}>✔ Listed in Search</li>
            <li style={styles.featureItem}>✔ Basic Support</li>
            <li style={styles.featureItem}>✔ 1x Visibility</li>
          </ul>
        </div>

        {/*PLATINUM*/}
        <div style={styles.cardPlatinum}>
          <div style={styles.badgePlatinum}>Platinum</div>

          <h2 style={styles.planName}>Platinum Yearly</h2>
          <p style={styles.planType}>Best Long-Term Value</p>

          <h1 style={styles.pricePlatinum}>
            ₹1499 <span style={styles.priceMonth}>/year</span>
          </h1>


          <button style={styles.startPlatinum}>Choose Platinum</button>
          <div style={styles.dividerPlatinum}></div>

          <h3 style={styles.includesTitle}>Includes:</h3>
          <p style={styles.dayPricePlatinum}>₹4.1 / day</p>
          <ul style={styles.featuresListPlatinum}>
            <li style={styles.featureItem}>✔ Top Search Ranking</li>
            <li style={styles.featureItem}>✔ Premium Support</li>
            <li style={styles.featureItem}>✔ 3x Visibility</li>
            <li style={styles.featureItem}>✔ Unlimited Ads Posting</li>
          </ul>
        </div>

        {/*GOLD */}
        <div style={styles.cardGold}>
          <div style={styles.badgeGold}>Gold</div>

          <h2 style={styles.planName}>Gold Plan</h2>
          <p style={styles.planType}>3 Months Business Boost</p>

          <h1 style={styles.priceGold}>
            ₹499 <span style={styles.priceMonth}>/3 months</span>
          </h1>


          <button style={styles.startGold}>Choose Gold</button>
          <div style={styles.dividerGold}></div>

          <h3 style={styles.includesTitle}>Includes:</h3>
          <p style={styles.dayPriceGold}>₹5.5 / day</p>
          <ul style={styles.featuresListGold}>
            <li style={styles.featureItem}>✔ Top Search Listing</li>
            <li style={styles.featureItem}>✔ Priority Support</li>
            <li style={styles.featureItem}>✔ 2x Visibility</li>
            <li style={styles.featureItem}>✔ Ads Posting Access</li>
          </ul>
        </div>

      </div>

      {/*BENEFITS*/}
      <h1 style={benefitStyles.heading}>RK Dail Helps You Grow Your Business</h1>

      <div style={benefitStyles.container}>
        {/* CARD 1 */}
        <div style={benefitStyles.card}>
          <img src="https://cdn-icons-png.flaticon.com/512/1040/1040230.png" style={benefitStyles.icon} />
          <h3 style={benefitStyles.title}>Increase Daily Visibility</h3>
          <p style={benefitStyles.text}>Show your business to new users daily.</p>
        </div>

        {/* CARD 2 */}
        <div style={benefitStyles.card}>
          <img src="https://cdn-icons-png.flaticon.com/512/1170/1170576.png" style={benefitStyles.icon} />
          <h3 style={benefitStyles.title}>Grow Revenue</h3>
          <p style={benefitStyles.text}>Daily reach helps increase customers.</p>
        </div>

        {/* CARD 3 */}
        <div style={benefitStyles.card}>
          <img src="https://cdn-icons-png.flaticon.com/512/2331/2331953.png" style={benefitStyles.icon} />
          <h3 style={benefitStyles.title}>More Customers</h3>
          <p style={benefitStyles.text}>More visibility → more calls.</p>
        </div>
      </div>
    </div>
  );
}

//ALL STYLES

const styles = {
  page: {
    background: "#0f0f0f",
    minHeight: "100vh",
    padding: "40px 20px",
    textAlign: "center",
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  title: { fontSize: "46px", fontWeight: 700, marginBottom: 10 },
  subtitle: { color: "#c7c7c7", fontSize: "16px", marginBottom: "35px" },

  planRow: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    flexWrap: "wrap",
  },

  //Silver
  cardSilver: {
    background: "#d8d8d8",
    width: "320px",
    padding: "30px",
    color: "#000",
    borderRadius: "16px",
    border: "2px solid #bbbbbb",
    position: "relative",
  },

  badgeSilver: {
    background: "#c0c0c0",
    padding: "6px 18px",
    borderRadius: "12px",
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: "700",
  },

  priceSilver: { fontSize: "50px", fontWeight: "900", color: "#555" },
  dayPriceSilver: { fontSize: "18px" },
  startSilver: {
    width: "100%", padding: "12px", background: "#555", color: "#fff",
    fontWeight: 700, borderRadius: "10px", border: "none",
  },
  dividerSilver: { height: "1px", background: "#aaa", margin: "20px 0" },
  featuresListSilver: { padding: 0, listStyle: "none", color: "#000" },

  //Platinum
  cardPlatinum: {
    background: "linear-gradient(145deg, #ffffff, #d6d6d6)",
    width: "340px",
    padding: "30px",
    borderRadius: "18px",
    border: "2px solid #e3e3e3",
    boxShadow: "0px 0px 25px rgba(255,255,255,0.3)",
    color: "#000",
    position: "relative",
  },

  badgePlatinum: {
    background: "#fff",
    padding: "6px 18px",
    borderRadius: "12px",
    top: "-12px",
    left: "50%",
    position: "absolute",
    transform: "translateX(-50%)",
    fontWeight: 700,
    border: "1px solid #ccc",
  },

  pricePlatinum: { fontSize: "50px", fontWeight: "900", color: "#5e5e5e" },
  dayPricePlatinum: { fontSize: "18px" },
  startPlatinum: {
    width: "100%", background: "#000", padding: "12px", color: "#fff",
    borderRadius: "10px", fontWeight: 700, border: "none",
  },
  dividerPlatinum: { background: "#bbb", height: "1px", margin: "20px 0" },
  featuresListPlatinum: { listStyle: "none", padding: 0 },

 //Gold
  cardGold: {
    background: "linear-gradient(180deg, #ffe29f, #ffa751)",
    width: "320px",
    padding: "30px",
    borderRadius: "16px",
    border: "2px solid #ffcb6b",
    color: "#000",
    boxShadow: "0px 0px 20px rgba(255,200,0,0.3)",
    position: "relative",
  },

  badgeGold: {
    background: "#fff",
    padding: "6px 18px",
    borderRadius: "12px",
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: 700,
  },

  priceGold: { fontSize: "50px", fontWeight: "900", color: "#8a5300" },
  dayPriceGold: { fontSize: "18px" },
  startGold: {
    width: "100%", padding: "12px", background: "#000",
    color: "#fff", borderRadius: "10px", fontWeight: 700, border: "none",
  },
  dividerGold: { background: "#a87b00", height: "1px", margin: "20px 0" },
  featuresListGold: { listStyle: "none", padding: 0 },
};

/*BENEFIT STYLES */

const benefitStyles = {
  heading: {
    fontSize: "34px",
    fontWeight: 700,
    marginTop: "60px",
    marginBottom: "40px",
  },

  container: {
    display: "flex",
    justifyContent: "center",
    gap: "60px",
    flexWrap: "wrap",
  },

  card: {
    width: "260px",
    background: "#181818",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #333",
    textAlign: "center",
  },

  icon: {
    width: "90px",
    height: "90px",
    marginBottom: "15px",
  },

  title: { fontSize: "20px", fontWeight: 700, marginBottom: "10px" },
  text: { fontSize: "15px", color: "#cfcfcf", lineHeight: "22px" },
};
