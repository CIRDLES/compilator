/*
 * Copyright 2016 CIRDLES.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* don't forget to add the following maven dependency:
    <dependency>
      <groupId>com.athaydes.automaton</groupId>
      <artifactId>Automaton</artifactId>
      <version>1.3.2</version>
      <scope>test</scope>
    </dependency>
*/

package org.earthtime;

import com.athaydes.automaton.Swinger;
import java.io.File;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import java.awt.Robot;
import static org.junit.Assert.*;
import static com.athaydes.automaton.selector.StringSelectors.matchingAll;
import java.awt.AWTException;
import java.awt.event.InputEvent;

/**
 *
 * @author jhl
 */
public class ETReduxTest {
    private Swinger swinger;
    private Robot robot;
    
    @BeforeClass
    public static void setUpClass() throws Exception {
        // Run this program as a GUI application
        System.setProperty("java.awt.headless", "false");
        
        // Create new ETRedux Instance
        new ETRedux(new File("reduxPath"));
        
        // sleep to give window time to initialize
        Thread.sleep(3000);
    }

    @Before
    public void setUp() throws AWTException {
        // create new swinger for main window
        swinger = Swinger.forSwingWindow();
        robot = new Robot();
    } 
    
    @Test
    public void swingTest() {
        {{{dragTest}}}

        /* YOU MUST CHANGE THIS to make it possible for the test to fail */
        assertTrue(true);
    }    
}