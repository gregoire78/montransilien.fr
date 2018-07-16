import React from 'react';

export default class Marquee extends React.Component
{
    constructor(props)
    {
        super(props);
        this.setOuterRef = this.setOuterRef_.bind(this);
        this.setContentRef = this.setContentRef_.bind(this);
        this.tick = this.tick_.bind(this);
        this.tickRequested = false;
        this.lastTimestamp = null;
        this.y = 0;
    }

    setOuterRef_(ref)
    {
        this.outerDiv = ref;
        this.start();
    }
    setContentRef_(ref)
    {
        this.innerDiv = ref;
        this.start ();
    }
    start ()
    {
        if (this.outerDiv && this.innerDiv && !this.tickRequested){
            //if(this.outerDiv.clientWidth - this.innerDiv.clientWidth < 0 ) {
                setTimeout(this.startInit.bind(this), this.getWaitBeforeStart())
            //}
        }
    }
    startInit(){
        window.requestAnimationFrame(this.tick);
        this.tickRequested = true;
    }
    tick_ (timestamp)
    {
        if (!this.outerDiv || !this.innerDiv)
        {
            // one or more components have been unmounted.  stop animation
            // until they are remounted (if ever)
            this.tickRequested = false;
            return;
        }

        if (document.documentElement.clientHeight - (document.getElementById('listView').clientHeight+this.outerDiv.clientHeight) >= 0 && this.tickRequested)
        {
            this.setOuterRef = this.setOuterRef_.bind(this);
            this.setContentRef = this.setContentRef_.bind(this);
            this.tick = this.tick_.bind(this);
            this.tickRequested = false;
            this.lastTimestamp = null;
            this.y = 0;
            return;
        }

        if (this.lastTimestamp !== null)
        {
            this.updateAnimation (timestamp - this.lastTimestamp);
        }

        this.lastTimestamp = timestamp;
        window.requestAnimationFrame(this.tick);
        this.lastTimestamp = timestamp;
    }

    updateAnimation (deltaT)
    {
        this.y -= deltaT * this.getVelocity ();
        if (this.y + this.innerDiv.clientHeight < 0)
            //this.y = 0; // repart au début
            this.y += this.innerDiv.clientHeight + this.innerDiv.clientHeight; // repart de l'autre bout de l'écran
        this.innerDiv.style.transform = this.calculateTransform();
    }

    getVelocity ()
    {
        //const varition = 100 - Math.round(Math.pow(10, 2))/Math.pow(10, 2);
        //if(varition > 50)
            return this.props.velocity ? this.props.velocity : 0.12;
        //else
            //return this.props.velocity ? this.props.velocity + (this.props.velocity * (varition/100)) : 0.12 + (0.12 * (varition/100));
    }
    getWaitBeforeStart ()
    {
        return this.props.waitBeforeStart ? this.props.waitBeforeStart : 2000;
    }
    render ()
    {
        return (
            <div className="MarqueeY" ref={this.setOuterRef}>
                <div className="MarqueeYContent" ref={this.setContentRef} style={{transform: this.calculateTransform()}}>{this.props.children}</div>
            </div>
        );
    }

    calculateTransform ()
    {
        return "translateY(" + this.y + "px)";
    }
}